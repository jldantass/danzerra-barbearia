package projeto.barbearia.danzerra.planocliente.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import projeto.barbearia.danzerra.cliente.entity.Cliente;
import projeto.barbearia.danzerra.plano.entity.Plano;
import projeto.barbearia.danzerra.plano.entity.PlanoBeneficio;

@Entity
@Table(name = "planos_cliente")
public class PlanoCliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plano_id", nullable = false)
    private Plano plano;

    @Column(name = "nome_plano", nullable = false, length = 120)
    private String nomePlano;

    @Column(name = "preco_pago", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoPago;

    @Column(nullable = false)
    private LocalDate inicio;

    @Column(nullable = false)
    private LocalDate vencimento;

    @OneToMany(mappedBy = "periodo", cascade = CascadeType.PERSIST)
    private List<PlanoClienteBeneficio> beneficios = new ArrayList<>();

    protected PlanoCliente() {
    }

    public PlanoCliente(Cliente cliente, Plano plano, LocalDate inicio) {
        this.cliente = cliente;
        this.plano = plano;
        this.nomePlano = plano.getNome();
        this.precoPago = plano.getPrecoMensal();
        this.inicio = inicio;
        this.vencimento = inicio.plusMonths(1);
        plano.getBeneficios().forEach(this::adicionarBeneficio);
    }

    private void adicionarBeneficio(PlanoBeneficio beneficio) {
        beneficios.add(new PlanoClienteBeneficio(this, beneficio.getServico(), beneficio.getQuantidade()));
    }

    public boolean vigenteEm(LocalDate data) {
        return !data.isBefore(inicio) && !data.isAfter(vencimento);
    }

    public Long getId() {
        return id;
    }

    public Plano getPlano() {
        return plano;
    }

    public String getNomePlano() {
        return nomePlano;
    }

    public BigDecimal getPrecoPago() {
        return precoPago;
    }

    public LocalDate getInicio() {
        return inicio;
    }

    public LocalDate getVencimento() {
        return vencimento;
    }

    public List<PlanoClienteBeneficio> getBeneficios() {
        return List.copyOf(beneficios);
    }
}
