package projeto.barbearia.danzerra.administrador.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "administradores")
public class Administrador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String login;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    protected Administrador() {
    }

    public Administrador(String login, String senhaHash) {
        this.login = login;
        this.senhaHash = senhaHash;
    }

    public String getSenhaHash() {
        return senhaHash;
    }
}