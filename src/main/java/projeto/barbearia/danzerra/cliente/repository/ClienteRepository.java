package projeto.barbearia.danzerra.cliente.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import projeto.barbearia.danzerra.cliente.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByNomeContainingIgnoreCaseAndCelularContaining(
            String nome, String celular, Pageable pagina);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Cliente> findClienteById(Long id);
}
