ALTER TABLE planos
    ADD COLUMN excluido BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_planos_excluido_inativo CHECK (NOT excluido OR NOT ativo);

CREATE TABLE planos_cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes (id),
    plano_id BIGINT NOT NULL REFERENCES planos (id),
    nome_plano VARCHAR(120) NOT NULL,
    preco_pago NUMERIC(10, 2) NOT NULL,
    inicio DATE NOT NULL,
    vencimento DATE NOT NULL,
    CONSTRAINT ck_planos_cliente_datas CHECK (vencimento >= inicio),
    CONSTRAINT ck_planos_cliente_preco CHECK (preco_pago >= 0 AND preco_pago <> 'NaN'::numeric),
    CONSTRAINT uk_planos_cliente_inicio UNIQUE (cliente_id, inicio)
);

CREATE INDEX idx_planos_cliente_cliente_vencimento ON planos_cliente (cliente_id, vencimento DESC);
CREATE INDEX idx_planos_cliente_plano_vencimento ON planos_cliente (plano_id, vencimento);

CREATE TABLE planos_cliente_beneficios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    periodo_id BIGINT NOT NULL REFERENCES planos_cliente (id) ON DELETE CASCADE,
    servico_id BIGINT NOT NULL REFERENCES servicos (id),
    cota INTEGER NOT NULL CHECK (cota > 0),
    usados INTEGER NOT NULL DEFAULT 0 CHECK (usados >= 0),
    CONSTRAINT uk_planos_cliente_beneficio UNIQUE (periodo_id, servico_id)
);
