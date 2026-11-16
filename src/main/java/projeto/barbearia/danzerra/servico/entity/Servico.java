package projeto.barbearia.danzerra.servico.entity;

import java.math.BigDecimal;

import org.hibernate.annotations.DynamicUpdate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "servicos")
@DynamicUpdate
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "preco_avulso", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoAvulso;

    @Column(name = "duracao_minutos", nullable = false)
    private int duracaoMinutos;

    @Column(nullable = false)
    private boolean ativo = true;

    protected Servico() {
    }

    public Servico(String nome, BigDecimal precoAvulso, int duracaoMinutos) {
        this.nome = nome;
        this.precoAvulso = precoAvulso;
        this.duracaoMinutos = duracaoMinutos;
    }

    public void atualizarDados(String nome, BigDecimal precoAvulso, int duracaoMinutos) {
        this.nome = nome;
        this.precoAvulso = precoAvulso;
        this.duracaoMinutos = duracaoMinutos;
    }

    public void alternarAtivo() {
        this.ativo = !this.ativo;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public BigDecimal getPrecoAvulso() {
        return precoAvulso;
    }

    public int getDuracaoMinutos() {
        return duracaoMinutos;
    }
}
