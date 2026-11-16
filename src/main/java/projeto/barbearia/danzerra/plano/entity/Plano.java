package projeto.barbearia.danzerra.plano.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "planos")
public class Plano {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "preco_mensal", precision = 10, scale = 2)
    private BigDecimal precoMensal;

    @Column(nullable = false)
    private boolean ativo;

    @ElementCollection
    @CollectionTable(name = "plano_beneficios", joinColumns = @JoinColumn(name = "plano_id"))
    private List<PlanoBeneficio> beneficios = new ArrayList<>();

    protected Plano() {
    }

    public Plano(String nome, BigDecimal precoMensal, List<PlanoBeneficio> beneficios) {
        this.nome = nome;
        this.precoMensal = precoMensal;
        this.beneficios.addAll(beneficios);
    }

    public void atualizarDados(String nome, BigDecimal precoMensal) {
        this.nome = nome;
        this.precoMensal = precoMensal;
    }

    public void substituirBeneficios(List<PlanoBeneficio> novosBeneficios) {
        this.beneficios.clear();
        this.beneficios.addAll(novosBeneficios);
    }

    public void definirAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public BigDecimal getPrecoMensal() {
        return precoMensal;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public List<PlanoBeneficio> getBeneficios() {
        return List.copyOf(beneficios);
    }
}
