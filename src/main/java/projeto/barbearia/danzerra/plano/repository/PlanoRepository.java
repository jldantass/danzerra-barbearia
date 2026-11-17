package projeto.barbearia.danzerra.plano.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import projeto.barbearia.danzerra.plano.entity.Plano;

public interface PlanoRepository extends JpaRepository<Plano, Long> {

    @Query(value = "SELECT id FROM barbearia_configuracao WHERE id = 1 FOR UPDATE", nativeQuery = true)
    int bloquearCatalogo();

    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE planos SET ativo = FALSE
            WHERE ativo AND NOT excluido
                AND id IN (SELECT plano_id FROM plano_beneficios WHERE servico_id = :servicoId)
            """, nativeQuery = true)
    void desativarPlanosComServico(Long servicoId);

    @EntityGraph(attributePaths = {"beneficios", "beneficios.servico"})
    List<Plano> findAllByExcluidoFalse(Sort ordenacao);

    @EntityGraph(attributePaths = {"beneficios", "beneficios.servico"})
    Optional<Plano> findByIdAndExcluidoFalse(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Plano> findPlanoByIdAndExcluidoFalse(Long id);
}
