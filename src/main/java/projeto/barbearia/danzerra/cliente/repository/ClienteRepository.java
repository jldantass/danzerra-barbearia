package projeto.barbearia.danzerra.cliente.repository;

import java.time.LocalDate;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import projeto.barbearia.danzerra.cliente.entity.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("""
            select c from Cliente c
            where locate(lower(:nome), lower(c.nome)) > 0
              and locate(:celular, c.celular) > 0
              and (:planoAtivo = false or exists (
                  select p.id from PlanoCliente p
                  where p.cliente = c and :hoje between p.inicio and p.vencimento
              ))
            """)
    Page<Cliente> buscar(String nome, String celular, boolean planoAtivo, LocalDate hoje, Pageable pagina);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Cliente> findClienteById(Long id);
}
