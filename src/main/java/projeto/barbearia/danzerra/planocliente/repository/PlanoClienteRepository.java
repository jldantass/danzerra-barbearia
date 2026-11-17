package projeto.barbearia.danzerra.planocliente.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import projeto.barbearia.danzerra.planocliente.entity.PlanoCliente;

public interface PlanoClienteRepository extends JpaRepository<PlanoCliente, Long> {

    Optional<PlanoCliente> findFirstByClienteIdOrderByVencimentoDescIdDesc(Long clienteId);
}
