const STEPS = [1, 2, 2.5, 5, 10];

/**
 * As marcas redondas de um eixo que vai de zero até passar do maior valor, umas quatro:
 * 0, 5, 10, 15, 20 para 17. Um eixo sem valor algum vai de 0 a 1.
 */
export function chartTicksOf(args: { max: number; count: number }): number[] {
  if (!Number.isFinite(args.max) || args.max <= 0) return [0, 1];

  const rough = args.max / args.count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = (STEPS.find((one) => one * power >= rough) ?? 10) * power;
  const top = Math.ceil(args.max / step) * step;

  return Array.from({ length: Math.round(top / step) + 1 }, (_, index) =>
    Number((index * step).toPrecision(12)),
  );
}
