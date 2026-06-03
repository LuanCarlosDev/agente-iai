from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# ==========================================================================
# SCHEMAS DE EMPRESA
# ==========================================================================
class EmpresaBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100, description="Nome da empresa cliente")
    cnpj: Optional[str] = Field(None, max_length=20, description="CNPJ da empresa (opcional)")

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaResponse(EmpresaBase):
    id: int
    data_criacao: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================================
# SCHEMAS DE USUÁRIO
# ==========================================================================
class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100, description="Nome do usuário")
    email: EmailStr = Field(..., description="E-mail exclusivo de acesso")
    role: str = Field(..., description="Perfil de acesso: adm, gestor ou secretaria")
    empresa_id: Optional[int] = Field(None, description="ID da empresa associada (vazio para ADM)")

class UsuarioCreate(UsuarioBase):
    senha: str = Field(..., min_length=6, max_length=50, description="Senha de acesso em texto puro")

class UsuarioResponse(UsuarioBase):
    id: int
    data_criacao: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================================
# SCHEMAS DE CONTATO
# ==========================================================================
class ContatoBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    whatsapp: str = Field(..., min_length=10, max_length=20)
    status: str = Field("lead", description="lead, qualificado, atendimento_humano, concluido")
    ia_ativo: bool = Field(True, description="Indica se a IA gerencia a conversa")
    empresa_id: int

class ContatoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    whatsapp: str = Field(..., min_length=10, max_length=20)

class ContatoResponse(ContatoBase):
    id: int
    data_criacao: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================================
# SCHEMAS DE MENSAGEM
# ==========================================================================
class MensagemBase(BaseModel):
    contato_id: int
    remetente: str = Field(..., description="cliente, ia, humano")
    texto: str = Field(..., min_length=1)

class MensagemCreate(BaseModel):
    texto: str = Field(..., min_length=1)

class MensagemResponse(MensagemBase):
    id: int
    data_envio: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================================
# SCHEMAS DE CONFIGURAÇÃO DE IA
# ==========================================================================
class ConfigIABase(BaseModel):
    prompt_sistema: str = Field(..., min_length=10, description="Instruções e conhecimento do Agente IA")

class ConfigIACreate(ConfigIABase):
    pass

class ConfigIAResponse(ConfigIABase):
    id: int
    empresa_id: int
    data_atualizacao: datetime

    model_config = {
        "from_attributes": True
    }


# ==========================================================================
# SCHEMAS DE AUTENTICAÇÃO / LOGIN
# ==========================================================================
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: UsuarioResponse

class RegisterGestorRequest(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100, description="Nome completo do Gestor")
    email: EmailStr = Field(..., description="E-mail de acesso corporativo")
    senha: str = Field(..., min_length=6, max_length=50, description="Senha de acesso")
    nome_empresa: str = Field(..., min_length=2, max_length=100, description="Nome da empresa a ser criada")
