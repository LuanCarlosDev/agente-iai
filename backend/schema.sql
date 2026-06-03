-- DDL para criação das tabelas no Supabase (PostgreSQL)
-- IAI Soluções - Banco de Dados Profissional

-- 1. Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(20) NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index para otimização de busca
CREATE INDEX IF NOT EXISTS idx_empresas_nome ON empresas(nome);

-- 2. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('adm', 'gestor', 'secretaria')),
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index para buscas rápidas por e-mail e empresa
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

-- 3. Tabela de Contatos
CREATE TABLE IF NOT EXISTS contatos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'lead' NOT NULL CHECK (status IN ('lead', 'qualificado', 'atendimento_humano', 'concluido')),
    ia_ativo BOOLEAN DEFAULT TRUE NOT NULL,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index para buscas frequentes do chat
CREATE INDEX IF NOT EXISTS idx_contatos_whatsapp ON contatos(whatsapp);
CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON contatos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);

-- 4. Tabela de Mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    contato_id INTEGER REFERENCES contatos(id) ON DELETE CASCADE NOT NULL,
    remetente VARCHAR(20) NOT NULL CHECK (remetente IN ('cliente', 'ia', 'humano')),
    texto TEXT NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index para carregar histórico de mensagens rapidamente
CREATE INDEX IF NOT EXISTS idx_mensagens_contato_id ON mensagens(contato_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_data_envio ON mensagens(data_envio DESC);

-- 5. Tabela de Configurações da IA (ConfigIA)
CREATE TABLE IF NOT EXISTS config_ia (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER UNIQUE REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    prompt_sistema TEXT NOT NULL,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index para busca rápida de configuração por empresa
CREATE INDEX IF NOT EXISTS idx_config_ia_empresa_id ON config_ia(empresa_id);

-- Trigger para atualizar a coluna data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION update_config_ia_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_config_ia
BEFORE UPDATE ON config_ia
FOR EACH ROW
EXECUTE FUNCTION update_config_ia_timestamp();

-- 6. Semente do Administrador Padrão (iai@gmail.com)
-- Nota: A senha padrão inserida é 'iai123456', cujo hash bcrypt gerado é inserido abaixo.
INSERT INTO usuarios (nome, email, senha_hash, role, empresa_id)
VALUES (
    'IAI Administrador', 
    'iai@gmail.com', 
    '$2b$12$1upOQ0DRPgpnMNxk5EVI3eKGZPYdjAj9/xuacgEHcbBxndhp0Zina', 
    'adm', 
    NULL
)
ON CONFLICT (email) DO NOTHING;
