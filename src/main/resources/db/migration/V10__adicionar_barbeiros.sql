CREATE TABLE barbeiros (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(120) NOT NULL CHECK (BTRIM(nome) <> ''),
    celular VARCHAR(15),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO barbeiros (nome) VALUES ('Barbeiro principal');

ALTER TABLE atendimentos ADD COLUMN barbeiro_id BIGINT REFERENCES barbeiros (id);
UPDATE atendimentos SET barbeiro_id = (SELECT MIN(id) FROM barbeiros);
ALTER TABLE atendimentos ALTER COLUMN barbeiro_id SET NOT NULL;

CREATE INDEX idx_atendimentos_barbeiro_inicio ON atendimentos (barbeiro_id, inicio);
