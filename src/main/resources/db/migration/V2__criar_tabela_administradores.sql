CREATE TABLE administradores (
     id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     login VARCHAR(50) NOT NULL,
     senha_hash VARCHAR(255) NOT NULL,
     CONSTRAINT uq_administradores_login UNIQUE (login)
);