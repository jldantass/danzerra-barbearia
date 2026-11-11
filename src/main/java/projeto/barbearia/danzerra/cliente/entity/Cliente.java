package projeto.barbearia.danzerra.cliente.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 15)
    private String celular;

    protected Cliente() {
    }

    public Cliente(String nome, String celular) {
        this.nome = nome;
        this.celular = celular;
    }

    public void atualizarDados(String nome, String celular) {
        this.nome = nome;
        this.celular = celular;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getCelular() {
        return celular;
    }
}