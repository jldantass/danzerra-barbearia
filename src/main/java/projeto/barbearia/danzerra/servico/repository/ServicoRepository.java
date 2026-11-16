package projeto.barbearia.danzerra.servico.repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import projeto.barbearia.danzerra.servico.entity.Servico;

public interface ServicoRepository extends JpaRepository<Servico, Long> {

    List<Servico> findAllByAtivoTrue(Sort ordenacao);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Servico> findServicoById(Long id);
}
