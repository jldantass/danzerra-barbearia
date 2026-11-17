UPDATE planos
SET ativo = FALSE
WHERE ativo AND EXISTS (
    SELECT 1
    FROM plano_beneficios beneficio
    JOIN servicos servico ON servico.id = beneficio.servico_id
    WHERE beneficio.plano_id = planos.id AND NOT servico.ativo
);
