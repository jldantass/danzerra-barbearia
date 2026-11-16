CREATE TABLE planos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    preco_mensal NUMERIC(10, 2),
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_planos_preco_mensal CHECK (
        preco_mensal >= 0 AND preco_mensal <> 'NaN'::numeric
    ),
    CONSTRAINT ck_planos_ativo_com_preco CHECK (NOT ativo OR preco_mensal IS NOT NULL)
);

CREATE TABLE plano_beneficios (
    plano_id BIGINT NOT NULL REFERENCES planos (id) ON DELETE CASCADE,
    servico_id BIGINT REFERENCES servicos (id),
    nome_pendente VARCHAR(120),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    CONSTRAINT ck_plano_beneficios_referencia CHECK (
        (servico_id IS NOT NULL) <> (nome_pendente IS NOT NULL)
    ),
    CONSTRAINT uk_plano_beneficios_servico UNIQUE (plano_id, servico_id),
    CONSTRAINT uk_plano_beneficios_pendente UNIQUE (plano_id, nome_pendente)
);

WITH modelos (nome, cortes, hidratacoes, barbas) AS (
    VALUES ('Mensal Simples', 2, 1, 0),
           ('Mensal Avançado', 4, 2, 0),
           ('Mensal Simples com Barba', 2, 1, 2),
           ('Mensal Avançado com Barba', 4, 2, 4)
),
novos_planos AS (
    INSERT INTO planos (nome)
    SELECT nome FROM modelos
    RETURNING id, nome
)
INSERT INTO plano_beneficios (plano_id, servico_id, nome_pendente, quantidade)
SELECT plano.id, servico.id,
       CASE WHEN servico.id IS NULL THEN beneficio.nome END,
       beneficio.quantidade
FROM novos_planos plano
JOIN modelos ON modelos.nome = plano.nome
CROSS JOIN LATERAL (
    VALUES ('Corte de Cabelo', modelos.cortes),
           ('Hidratação', modelos.hidratacoes),
           ('Barba', modelos.barbas)
) beneficio (nome, quantidade)
LEFT JOIN LATERAL (
    SELECT MIN(id) AS id
    FROM servicos
    WHERE LOWER(TRIM(nome)) = LOWER(beneficio.nome)
    HAVING COUNT(*) = 1
) servico ON TRUE
WHERE beneficio.quantidade > 0;
