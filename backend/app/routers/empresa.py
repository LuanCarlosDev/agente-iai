from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import require_adm
from app.core.auth import get_password_hash
from app.models.models import Empresa, Usuario
from app.schemas.models import EmpresaCreate, EmpresaResponse, UsuarioResponse, UsuarioCreate

router = APIRouter(
    prefix="/empresa",
    tags=["Administrativo (ADM)"]
)

@router.post("/setup-adm", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_adm_inicial(req: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Endpoint público temporário para criar o PRIMEIRO Administrador do sistema.
    Bloqueia automaticamente após o primeiro usuário ser criado.
    """
    total_usuarios = db.query(Usuario).count()
    if total_usuarios > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ação bloqueada. O sistema já possui usuários cadastrados."
        )
    
    senha_criptografada = get_password_hash(req.senha)
    novo_adm = Usuario(
        nome=req.nome,
        email=req.email,
        senha_hash=senha_criptografada,
        role="adm",
        empresa_id=None
    )
    db.add(novo_adm)
    db.commit()
    db.refresh(novo_adm)
    return novo_adm


@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def criar_empresa(req: EmpresaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(require_adm)):
    """
    Cria uma nova empresa cliente no sistema (Exclusivo ADM).
    """
    nova_empresa = Empresa(nome=req.nome, cnpj=req.cnpj)
    db.add(nova_empresa)
    db.commit()
    db.refresh(nova_empresa)
    return nova_empresa


@router.get("/", response_model=List[EmpresaResponse])
def listar_empresas(db: Session = Depends(get_db), current_user: Usuario = Depends(require_adm)):
    """
    Lista todas as empresas inquilinas cadastradas (Exclusivo ADM).
    """
    return db.query(Empresa).all()


@router.get("/usuarios", response_model=List[UsuarioResponse])
def listar_todos_usuarios(db: Session = Depends(get_db), current_user: Usuario = Depends(require_adm)):
    """
    Audita e lista todos os usuários de todas as empresas no sistema (Exclusivo ADM).
    """
    return db.query(Usuario).all()


@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def adm_criar_usuario(req: UsuarioCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(require_adm)):
    """
    Cadastra um novo usuário de qualquer perfil (gestor ou secretaria) vinculado a uma empresa parceira (Exclusivo ADM).
    """
    # 1. Verificar se o e-mail já existe
    email_existente = db.query(Usuario).filter(Usuario.email == req.email).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O e-mail fornecido já está cadastrado por outro usuário."
        )

    # 2. Se for gestor ou secretária, validar se a empresa existe
    if req.role in ["gestor", "secretaria"]:
        if not req.empresa_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empresa ID é obrigatório para perfis Gestor e Secretária."
            )
        empresa_existe = db.query(Empresa).filter(Empresa.id == req.empresa_id).first()
        if not empresa_existe:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="A empresa selecionada não existe."
            )

    senha_criptografada = get_password_hash(req.senha)
    novo_usuario = Usuario(
        nome=req.nome,
        email=req.email,
        senha_hash=senha_criptografada,
        role=req.role,
        empresa_id=req.empresa_id if req.role in ["gestor", "secretaria"] else None
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario
