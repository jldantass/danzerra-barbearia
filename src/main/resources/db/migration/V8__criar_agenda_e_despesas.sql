CREATE TABLE atendimentos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL REFERENCES clientes (id),
    inicio TIMESTAMP NOT NULL,
    fim TIMESTAMP NOT NULL CHECK (fim > inicio),
    status VARCHAR(15) NOT NULL DEFAULT 'AGENDADO'
        CHECK (status IN ('AGENDADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU')),
    concluido_em TIMESTAMP,
    CONSTRAINT ck_atendimento_conclusao CHECK ((status = 'CONCLUIDO') = (concluido_em IS NOT NULL))
);

CREATE INDEX idx_atendimentos_inicio ON atendimentos (inicio);
CREATE INDEX idx_atendimentos_cliente ON atendimentos (cliente_id, status);
CREATE INDEX idx_atendimentos_concluido ON atendimentos (concluido_em);

CREATE TABLE atendimento_servicos (
    atendimento_id BIGINT NOT NULL REFERENCES atendimentos (id),
    servico_id BIGINT NOT NULL REFERENCES servicos (id),
    nome VARCHAR(120) NOT NULL,
    preco_avulso NUMERIC(10, 2) NOT NULL CHECK (preco_avulso >= 0 AND preco_avulso <> 'NaN'::numeric),
    duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
    corte BOOLEAN NOT NULL,
    valor_cobrado NUMERIC(10, 2),
    coberto_por_plano BOOLEAN,
    PRIMARY KEY (atendimento_id, servico_id),
    CONSTRAINT ck_atendimento_cobranca CHECK (
        (valor_cobrado IS NULL AND coberto_por_plano IS NULL)
        OR (valor_cobrado IS NOT NULL AND coberto_por_plano IS NOT NULL
            AND valor_cobrado = CASE WHEN coberto_por_plano THEN 0 ELSE preco_avulso END)
    )
);

CREATE TABLE despesas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dia DATE NOT NULL,
    descricao VARCHAR(120) NOT NULL CHECK (BTRIM(descricao) <> ''),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0 AND valor <> 'NaN'::numeric)
);

CREATE INDEX idx_despesas_dia ON despesas (dia);
