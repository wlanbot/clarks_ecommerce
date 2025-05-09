// useCases/CreatePaymentUseCase.js
class CreatePaymentUseCase {
  constructor(paymentRepository, paymentService) {
    this.paymentRepository = paymentRepository;
    this.paymentService = paymentService;
  }

  async execute(dto) {
    const orderIdPayment = await this.paymentRepository.findByOrderId(dto.metadata.orderId);
    if (orderIdPayment) {
      throw new Error(`Ya existe un pago con ese orderId: ${dto.metadata.orderId}`);
    }

    const paymentResult = await this.paymentService.createPayment({
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      callbackUrl: dto.callbackUrl,
      metadata: dto.metadata,
      customerEmail: dto.customerEmail,
      items: dto.items,
      provider: dto.provider,
    });

    const payment = {
      amount: { amount: dto.amount, currency: dto.currency },
      status: paymentResult.status,
      provider: dto.provider,
      providerPaymentId: paymentResult.providerPaymentId,
      metadata: {
        ...dto.metadata,
        processorResponse: paymentResult.processorResponse,
      },
      orderId: dto.metadata.orderId
    };

    const savedPayment = await this.paymentRepository.create(payment);

    return {
      id: savedPayment._id.toString(),
      paymentId: savedPayment.providerPaymentId,
      status: savedPayment.status,
      redirectUrl: paymentResult.redirectUrl,
    };
  }
}

module.exports = CreatePaymentUseCase;