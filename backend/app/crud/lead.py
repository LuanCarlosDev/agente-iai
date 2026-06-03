from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate

def create_lead(db: Session, lead_in: LeadCreate) -> Lead:
    """
    Cadastra um novo lead no banco de dados.
    """
    db_lead = Lead(
        nome=lead_in.nome,
        email=lead_in.email,
        whatsapp=lead_in.whatsapp,
        tamanho_empresa=lead_in.tamanho_empresa,
        mensagem=lead_in.mensagem
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_leads(db: Session, skip: int = 0, limit: int = 100):
    """
    Busca uma lista de leads persistidos.
    """
    return db.query(Lead).order_by(Lead.id.desc()).offset(skip).limit(limit).all()
