package projeto.barbearia.danzerra.barbeiro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "barbeiros")
public class Barbeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 15)
    private String celular;

    @Column(nullable = false)
    private boolean ativo = true;

    protected Barbeiro() {
    }

    public Barbeiro(String nome, String celular) {
        atualizarDados(nome, celular);
    }

    public void atualizarDados(String nome, String celular) {
        this.nome = nome;
        this.celular = celular;
    }

    public void alternarAtivo() {
        ativo = !ativo;
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

    public boolean isAtivo() {
        return ativo;
    }
}
