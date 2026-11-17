CREATE TABLE barbearia_configuracao (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    nome VARCHAR(120) NOT NULL CHECK (BTRIM(nome) <> '')
);

INSERT INTO barbearia_configuracao (id, nome) VALUES (1, 'Danzerra Barbearia');
