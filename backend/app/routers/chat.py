from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import require_secretaria, require_gestor
from app.core.auth import get_password_hash
from app.models.models import Usuario, Contato, Mensagem, ConfigIA
from app.schemas.models import (
    ContatoResponse, ContatoCreate, MensagemResponse, 
    MensagemCreate, ConfigIAResponse, ConfigIACreate, 
    UsuarioResponse, UsuarioCreate
)

router = APIRouter(
    prefix="/chat",
    tags=["Módulos de Negócio (Chat & IA)"]
)

# ==========================================================================
# GESTÃO DE CONTATOS / CLIENTES
# ==========================================================================
@router.get("/contacts", response_model=List[ContatoResponse])
def listar_contatos(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Lista todos os clientes/contatos pertencentes exclusivamente à empresa do usuário autenticado.
    """
    return db.query(Contato).filter(Contato.empresa_id == current_user.empresa_id).all()


@router.post("/contacts", response_model=ContatoResponse, status_code=status.HTTP_201_CREATED)
def criar_contato(
    req: ContatoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Cadastra um novo cliente sob a base da empresa do usuário autenticado.
    """
    # Evita duplicação de número na mesma empresa inquilina
    contato_existente = db.query(Contato).filter(
        Contato.whatsapp == req.whatsapp,
        Contato.empresa_id == current_user.empresa_id
    ).first()
    if contato_existente:
        return contato_existente

    novo_contato = Contato(
        nome=req.nome,
        whatsapp=req.whatsapp,
        empresa_id=current_user.empresa_id,
        status="lead",
        ia_ativo=True
    )
    db.add(novo_contato)
    db.commit()
    db.refresh(novo_contato)
    return novo_contato


# ==========================================================================
# HISTÓRICO DE MENSAGENS E ATENDIMENTO MANUAL / IA
# ==========================================================================
@router.get("/messages/{contact_id}", response_model=List[MensagemResponse])
def listar_mensagens(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Retorna o histórico de mensagens de um cliente específico.
    Segurança SecOps: Garante que o cliente pertença à empresa do usuário atual.
    """
    contato = db.query(Contato).filter(Contato.id == contact_id).first()
    if not contato or contato.empresa_id != current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado na sua base de dados."
        )
        
    return db.query(Mensagem).filter(Mensagem.contato_id == contact_id).order_by(Mensagem.id.asc()).all()


@router.post("/send/{contact_id}", response_model=MensagemResponse, status_code=status.HTTP_201_CREATED)
def enviar_mensagem_humana(
    contact_id: int,
    req: MensagemCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Envia uma mensagem humana e assume o chat, desativando automaticamente o robô de IA para este cliente.
    """
    contato = db.query(Contato).filter(Contato.id == contact_id).first()
    if not contato or contato.empresa_id != current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente inválido."
        )

    # 1. Salvar a mensagem no histórico
    nova_mensagem = Mensagem(
        contato_id=contact_id,
        remetente="humano",
        texto=req.texto
    )
    db.add(nova_mensagem)

    # 2. Desativar a IA (Marcar como assumido pelo atendente)
    contato.ia_ativo = False
    contato.status = "atendimento_humano"
    
    db.commit()
    db.refresh(nova_mensagem)
    return nova_mensagem


@router.post("/release/{contact_id}", response_model=ContatoResponse)
def liberar_chat_para_ia(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Devolve o controle do chat para o robô de Inteligência Artificial.
    """
    contato = db.query(Contato).filter(Contato.id == contact_id).first()
    if not contato or contato.empresa_id != current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente inválido."
        )

    contato.ia_ativo = True
    db.commit()
    db.refresh(contato)
    return contato


# ==========================================================================
# CONFIGURAÇÃO DE INTELIGÊNCIA ARTIFICIAL (EXCLUSIVO GESTOR/ADM)
# ==========================================================================
@router.get("/config-ia", response_model=ConfigIAResponse)
def obter_config_ia(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_gestor)
):
    """
    Retorna as instruções de IA cadastradas para a empresa do usuário logado.
    """
    config = db.query(ConfigIA).filter(ConfigIA.empresa_id == current_user.empresa_id).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração de IA não encontrada."
        )
    return config


@router.post("/config-ia", response_model=ConfigIAResponse)
def atualizar_config_ia(
    req: ConfigIACreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_gestor)
):
    """
    Atualiza as instruções de IA da empresa (Exclusivo Gestores).
    """
    config = db.query(ConfigIA).filter(ConfigIA.empresa_id == current_user.empresa_id).first()
    if not config:
        config = ConfigIA(empresa_id=current_user.empresa_id, prompt_sistema=req.prompt_sistema)
        db.add(config)
    else:
        config.prompt_sistema = req.prompt_sistema
        
    db.commit()
    db.refresh(config)
    return config


# ==========================================================================
# GESTÃO DE SECRETÁRIAS (EXCLUSIVO GESTOR/ADM)
# ==========================================================================
@router.get("/secretarias", response_model=List[UsuarioResponse])
def listar_secretarias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_gestor)
):
    """
    Lista todos os usuários do tipo 'secretaria' cadastrados na empresa do Gestor autenticado.
    """
    return db.query(Usuario).filter(
        Usuario.empresa_id == current_user.empresa_id,
        Usuario.role == "secretaria"
    ).all()


@router.post("/secretarias", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_secretaria(
    req: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_gestor)
):
    """
    Cadastra uma nova secretária associada à empresa do Gestor autenticado.
    """
    # Impede e-mails duplicados globais
    email_existente = db.query(Usuario).filter(Usuario.email == req.email).first()
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O e-mail fornecido já está em uso por outro usuário."
        )

    senha_criptografada = get_password_hash(req.senha)
    nova_secretaria = Usuario(
        nome=req.nome,
        email=req.email,
        senha_hash=senha_criptografada,
        role="secretaria",
        empresa_id=current_user.empresa_id
    )
    db.add(nova_secretaria)
    db.commit()
    db.refresh(nova_secretaria)
    return nova_secretaria


# ==========================================================================
# SIMULAÇÃO DE RECEBIMENTO DE MENSAGENS (WEBHOOK MOCK)
# ==========================================================================
@router.post("/mock-receive/{contact_id}", response_model=MensagemResponse, status_code=status.HTTP_201_CREATED)
def mock_receber_mensagem_cliente(
    contact_id: int,
    req: MensagemCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_secretaria)
):
    """
    Simula o recebimento de uma mensagem do cliente via WhatsApp.
    Salva a mensagem recebida e aciona o robô de IA correspondente (se ativo)
    para gerar e persistir a resposta automática baseada no prompt cadastrado.
    """
    contato = db.query(Contato).filter(Contato.id == contact_id).first()
    if not contato or contato.empresa_id != current_user.empresa_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato inválido."
        )

    # 1. Salvar a mensagem recebida do cliente
    msg_cliente = Mensagem(
        contato_id=contact_id,
        remetente="cliente",
        texto=req.texto
    )
    db.add(msg_cliente)
    db.commit()
    db.refresh(msg_cliente)

    # 2. Se a IA estiver ativa para este contato, gera a resposta automatizada
    if contato.ia_ativo:
        # Carregar prompt de IA da empresa
        config_ia = db.query(ConfigIA).filter(ConfigIA.empresa_id == contato.empresa_id).first()
        prompt = config_ia.prompt_sistema if config_ia else "Você é um assistente virtual gentil."

        # Gerar resposta de IA baseada no contexto da mensagem
        texto_inferido = req.texto.lower()
        if "preço" in texto_inferido or "valor" in texto_inferido or "mensalidade" in texto_inferido or "quanto" in texto_inferido:
            resposta_ia_texto = "Nossos planos começam a partir de R$ 149/mês no Plano Starter. O Plano Growth, mais recomendado para equipes, sai por R$ 299/mês com atendentes ilimitados. Deseja que eu agende uma chamada comercial?"
        elif "integra" in texto_inferido or "hotmart" in texto_inferido or "kiwify" in texto_inferido:
            resposta_ia_texto = "Sim! Nós integramos de forma nativa e simples com Hotmart, Kiwify, ActiveCampaign e mais de 10 plataformas via Webhooks diretos. Quer que eu te envie o manual de integrações?"
        elif "funcion" in texto_inferido or "como" in texto_inferido:
            resposta_ia_texto = "A IAI Soluções centraliza todo o seu atendimento do WhatsApp. Você pode conectar vários atendentes sob o mesmo número e nossa IA qualifica os leads e agenda as reuniões para você de forma autônoma."
        else:
            resposta_ia_texto = f"Entendi! Seguindo minhas diretrizes da empresa ({prompt[:60]}...), posso te ajudar a tirar dúvidas sobre nossos serviços ou agendar uma demonstração rápida com nossa equipe humana. O que prefere?"

        # Salvar a mensagem de resposta da IA
        msg_ia = Mensagem(
            contato_id=contact_id,
            remetente="ia",
            texto=resposta_ia_texto
        )
        db.add(msg_ia)
        db.commit()

    return msg_cliente

