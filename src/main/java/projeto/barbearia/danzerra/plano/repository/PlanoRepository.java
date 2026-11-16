package projeto.barbearia.danzerra.plano.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import projeto.barbearia.danzerra.plano.entity.Plano;

public interface PlanoRepository extends JpaRepository<Plano, Long> {

    @Override
    @EntityGraph(attributePaths = {"beneficios", "beneficios.servico"})
    List<Plano> findAll(Sort ordenacao);

    @Override
    @EntityGraph(attributePaths = {"beneficios", "beneficios.servico"})
    Optional<Plano> findById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Plano> findPlanoById(Long id);
}
