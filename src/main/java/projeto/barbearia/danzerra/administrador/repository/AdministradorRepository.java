package projeto.barbearia.danzerra.administrador.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import projeto.barbearia.danzerra.administrador.entity.Administrador;

public interface AdministradorRepository extends JpaRepository<Administrador, Long> {

    Optional<Administrador> findByLogin(String login);
}