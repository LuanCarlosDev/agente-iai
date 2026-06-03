from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.models.models import Usuario, Empresa, ConfigIA
from app.schemas.models import LoginRequest, LoginResponse, RegisterGestorRequest, UsuarioResponse

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)

@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_gestor(req: RegisterGestorRequest, db: Session = Depends(get_db)):
    """
    Registra um novo gestor de empresa no sistema, criando também a empresa inquilina
    e inicializando a base de prompt de IA padrão da empresa.
    """
    # 1. Verificar se o e-mail já está em uso
    email_existente = db.query(Usuario).filter(Usuario.email == req.email).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O e-mail fornecido já está cadastrado no sistema."
        )

    # 2. Criar a Empresa associada
    nova_empresa = Empresa(nome=req.nome_empresa)
    db.add(nova_empresa)
    db.commit()
    db.refresh(nova_empresa)

    # 3. Criar o Usuário com Perfil Gestor
    senha_criptografada = get_password_hash(req.senha)
    novo_gestor = Usuario(
        nome=req.nome,
        email=req.email,
        senha_hash=senha_criptografada,
        role="gestor",
        empresa_id=nova_empresa.id
    )
    db.add(novo_gestor)

    # 4. Inicializar a Configuração de IA padrão da Empresa
    prompt_padrao = (
        f"Você é o consultor de vendas virtual da {req.nome_empresa}. "
        "Seu objetivo é responder dúvidas de forma gentil e objetiva pelo WhatsApp, "
        "qualificar o interesse do lead e agendar uma reunião comercial com nossos atendentes humanos."
    )
    nova_config_ia = ConfigIA(
        empresa_id=nova_empresa.id,
        prompt_sistema=prompt_padrao
    )
    db.add(nova_config_ia)
    
    db.commit()
    db.refresh(novo_gestor)
    return novo_gestor


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica um usuário (ADM, Gestor ou Secretária) e retorna o Token JWT de acesso.
    """
    usuario = db.query(Usuario).filter(Usuario.email == req.email).first()
    if not usuario or not verify_password(req.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Gerar token JWT contendo o e-mail no sub do payload
    access_token = create_access_token(data={"sub": usuario.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": usuario
    }
