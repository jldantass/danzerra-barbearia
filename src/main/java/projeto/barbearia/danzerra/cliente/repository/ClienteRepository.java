package projeto.barbearia.danzerra.cliente.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import projeto.barbearia.danzerra.cliente.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByNomeContainingIgnoreCaseAndCelularContaining(
            String nome, String celular, Pageable pagina);
}