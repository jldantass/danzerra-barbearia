CREATE TABLE servicos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    preco_avulso NUMERIC(10, 2) NOT NULL,
    duracao_minutos INTEGER NOT NULL,
    CONSTRAINT ck_servicos_preco_avulso CHECK (
        preco_avulso >= 0 AND preco_avulso <> 'NaN'::numeric
    ),
    CONSTRAINT ck_servicos_duracao CHECK (duracao_minutos > 0)
);
