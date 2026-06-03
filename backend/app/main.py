import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.models.models import Base
from app.routers import auth, empresa, chat

# Configuração simples de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("iai-solutions")

# Criação automática das tabelas do banco SQLite e injeção do ADM padrão
try:
    from app.core.database import SessionLocal
    from app.core.auth import get_password_hash
    from app.models.models import Usuario

    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas do banco de dados criadas com sucesso.")

    # Semente do Administrador Padrão
    db = SessionLocal()
    adm_existente = db.query(Usuario).filter(Usuario.email == "iai@gmail.com").first()
    if not adm_existente:
        novo_adm = Usuario(
            nome="IAI Administrador",
            email="iai@gmail.com",
            senha_hash=get_password_hash("iai123456"),
            role="adm",
            empresa_id=None
        )
        db.add(novo_adm)
        db.commit()
        logger.info("Administrador padrão (iai@gmail.com) inserido com sucesso no banco de dados.")
    db.close()
except Exception as e:
    logger.error(f"Erro ao inicializar tabelas ou semente do ADM: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API corporativa para gestão de agentes autônomos e CRM - IAI Soluções.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuração de CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão dos roteadores da API
app.include_router(auth.router, prefix="/api")
app.include_router(empresa.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/", tags=["Health"])
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "2.0.0"
    }
