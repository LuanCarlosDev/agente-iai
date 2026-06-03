from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    cnpj = Column(String(20), nullable=True)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    contatos = relationship("Contato", back_populates="empresa", cascade="all, delete-orphan")
    config_ia = relationship("ConfigIA", back_populates="empresa", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Empresa {self.nome}>"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    senha_hash = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)  # adm, gestor, secretaria
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    empresa = relationship("Empresa", back_populates="usuarios")

    def __repr__(self):
        return f"<Usuario {self.email} - Role: {self.role}>"


class Contato(Base):
    __tablename__ = "contatos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    whatsapp = Column(String(20), nullable=False)
    status = Column(String(30), default="lead")  # lead, qualificado, atendimento_humano, concluido
    ia_ativo = Column(Boolean, default=True)      # Se falso, indica que o humano assumiu a conversa
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    data_criacao = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    empresa = relationship("Empresa", back_populates="contatos")
    mensagens = relationship("Mensagem", back_populates="contato", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Contato {self.nome} - WhatsApp: {self.whatsapp}>"


class Mensagem(Base):
    __tablename__ = "mensagens"

    id = Column(Integer, primary_key=True, index=True)
    contato_id = Column(Integer, ForeignKey("contatos.id"), nullable=False)
    remetente = Column(String(20), nullable=False)  # cliente, ia, humano
    texto = Column(Text, nullable=False)
    data_envio = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    contato = relationship("Contato", back_populates="mensagens")

    def __repr__(self):
        return f"<Mensagem from {self.remetente}>"


class ConfigIA(Base):
    __tablename__ = "config_ia"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), unique=True, nullable=False)
    prompt_sistema = Column(Text, nullable=False)
    data_atualizacao = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relacionamentos
    empresa = relationship("Empresa", back_populates="config_ia")

    def __repr__(self):
        return f"<ConfigIA Empresa_ID: {self.empresa_id}>"
