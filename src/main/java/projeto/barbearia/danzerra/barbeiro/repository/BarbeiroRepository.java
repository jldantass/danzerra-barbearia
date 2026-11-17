package projeto.barbearia.danzerra.barbeiro.repository;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import projeto.barbearia.danzerra.barbeiro.entity.Barbeiro;

public interface BarbeiroRepository extends JpaRepository<Barbeiro, Long> {

    List<Barbeiro> findAllByAtivoTrue(Sort ordem);

    @Query(value = "SELECT EXISTS (SELECT 1 FROM atendimentos WHERE barbeiro_id = :id)", nativeQuery = true)
    boolean temAtendimentos(Long id);

    @Query(value = "SELECT id FROM barbearia_configuracao WHERE id = 1 FOR UPDATE", nativeQuery = true)
    Integer bloquearAgenda();
}
