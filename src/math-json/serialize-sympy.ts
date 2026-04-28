import type { MathJsonExpression as Expression } from './types';
import { operand, machineValue, symbol, operator, operands } from './utils';

// MathJSON symbols (constants) → SymPy literal source.
const SYMBOL_MAP: Record<string, string> = {
  Pi: 'pi',
  ExponentialE: 'E',
  ImaginaryUnit: 'I',
  Infinity: 'oo',
  PositiveInfinity: 'oo',
  NegativeInfinity: '-oo',
  NaN: 'nan',
  True: 'True',
  False: 'False',
  Half: 'Rational(1, 2)',
  Nothing: '',
};

// Functions whose SymPy spelling is just a lowercase variant of the
// MathJSON head (or a 1:1 rename).
const FUNCTION_MAP: Record<string, string> = {
  Sin: 'sin',
  Cos: 'cos',
  Tan: 'tan',
  Cot: 'cot',
  Sec: 'sec',
  Csc: 'csc',
  Arcsin: 'asin',
  Arccos: 'acos',
  Arctan: 'atan',
  Arccot: 'acot',
  Arcsec: 'asec',
  Arccsc: 'acsc',
  Sinh: 'sinh',
  Cosh: 'cosh',
  Tanh: 'tanh',
  Coth: 'coth',
  Sech: 'sech',
  Csch: 'csch',
  Arsinh: 'asinh',
  Arcosh: 'acosh',
  Artanh: 'atanh',
  Floor: 'floor',
  Ceil: 'ceiling',
  Round: 'round',
  Exp: 'exp',
  Ln: 'log',
  Abs: 'Abs',
  Real: 're',
  Imaginary: 'im',
  Conjugate: 'conjugate',
  Sign: 'sign',
  Factorial: 'factorial',
  Gcd: 'gcd',
  Lcm: 'lcm',
  Max: 'Max',
  Min: 'Min',
};

function serializeBaseForm(expr: Expression): string | null {
  if (operator(expr) !== 'BaseForm') return null;
  const op1 = machineValue(operand(expr, 1));
  if (op1 === null || !Number.isInteger(op1) || op1 < 0) return null;
  const base = machineValue(operand(expr, 2)) ?? 10;
  if (base === 2) return `0b${op1.toString(2)}`;
  if (base === 8) return `0o${op1.toString(8)}`;
  if (base === 16) return `0x${op1.toString(16)}`;
  return op1.toString();
}

function serializeNumber(expr: Expression): string | null {
  if (operator(expr) === 'Rational') {
    const op1 = operand(expr, 1);
    const op2 = operand(expr, 2);
    if (op1 === null || op2 === null) return null;
    return `Rational(${serializeNumber(op1)}, ${serializeNumber(op2)})`;
  }

  if (operator(expr) === 'Number') {
    const op1 = machineValue(operand(expr, 1));
    if (op1 === null) return null;
    return op1.toString();
  }

  if (operator(expr) === 'Complex') {
    const op1 = operand(expr, 1);
    const op2 = operand(expr, 2);
    if (op1 === null || op2 === null) return null;

    const mv1 = machineValue(op1);
    const mv2 = machineValue(op2);
    if (mv1 === null || mv2 === null) return null;

    // Complex(0, 1) is the imaginary unit.
    if (mv1 === 0 && mv2 === 1) return 'I';
    if (mv1 === 0 && mv2 === -1) return '(-I)';
    if (mv1 === 0) return serializeNumber(op2) + 'j';
    if (mv2 === 0) return serializeNumber(op1);
    return `(${serializeNumber(op1)} + ${serializeNumber(op2)}j)`;
  }

  const op1 = machineValue(expr);
  if (op1 === null) return null;
  return op1.toString();
}

function serializeSymbol(expr: Expression): string | null {
  const sym = symbol(expr);
  if (sym === null) return null;
  if (sym in SYMBOL_MAP) return SYMBOL_MAP[sym];
  // Greek letters, subscripted names (x_i), and arbitrary identifiers all
  // pass through unchanged — SymPy accepts them as Symbol(...).
  return sym;
}

function serializeArgs(args: ReadonlyArray<Expression>): string {
  return args.map((x) => serializeExpression(x)).join(', ');
}

function serializeInfix(
  op: string,
  args: ReadonlyArray<Expression>,
  spaced = true
): string {
  const sep = spaced ? ` ${op} ` : op;
  return `(${args.map((x) => serializeExpression(x)).join(sep)})`;
}

// Compute-engine wraps an integrand whose LaTeX has a postfix "dx" as
// ["Function", ["Block", body], boundVar]. The Function/Block layers are
// noise once we've extracted the bound variable from a sibling Limits, so
// strip them. Each iteration replaces `cur` with a strict subexpression,
// so the loop terminates on any finite MathJSON tree.
function unwrapIntegrand(expr: Expression): Expression {
  let cur = expr;
  while (
    operator(cur) === 'Function' ||
    (operator(cur) === 'Block' && operands(cur).length === 1)
  ) {
    cur = operand(cur, 1)!;
  }
  return cur;
}

// ["Limits", var, lo, hi]            → "(var, lo, hi)"   (definite)
// ["Limits", var, "Nothing", ...]    → "var"             (indefinite)
function serializeLimits(expr: Expression): string | null {
  if (operator(expr) !== 'Limits') return null;
  const v = serializeExpression(operand(expr, 1)!);
  const lo = operand(expr, 2);
  const hi = operand(expr, 3);
  const isNothing = (e: Expression | null) =>
    e === null || symbol(e) === 'Nothing';
  if (isNothing(lo) && isNothing(hi)) return v;
  return `(${v}, ${serializeExpression(lo!)}, ${serializeExpression(hi!)})`;
}

function serializeFunction(expr: Expression): string | null {
  const baseForm = serializeBaseForm(expr);
  if (baseForm !== null) return baseForm;

  const h = operator(expr);
  if (!h) return null;

  // Numeric heads are handled by serializeNumber.
  if (h === 'Complex' || h === 'Rational' || h === 'Number') {
    return serializeNumber(expr);
  }

  const args = operands(expr);

  // Arithmetic
  if (h === 'Add') return serializeInfix('+', args);
  if (h === 'Subtract') return serializeInfix('-', args);
  if (h === 'Multiply' || h === 'Times')
    return serializeInfix('*', args, false);
  if (h === 'Divide') return serializeInfix('/', args, false);
  if (h === 'Negate') {
    return `(-${serializeExpression(args[0])})`;
  }
  if (h === 'Power') {
    // e^x → exp(x) idiom
    if (symbol(args[0]) === 'ExponentialE') {
      return `exp(${serializeExpression(args[1])})`;
    }
    return `(${serializeExpression(args[0])}**${serializeExpression(args[1])})`;
  }
  if (h === 'Square') {
    return `(${serializeExpression(args[0])}**2)`;
  }
  if (h === 'Sqrt') {
    return `sqrt(${serializeExpression(args[0])})`;
  }
  if (h === 'Root') {
    return `((${serializeExpression(args[0])})**(1/${serializeExpression(args[1])}))`;
  }

  // Logarithms.
  // SymPy's log(x) is natural log; \log in compute-engine defaults to base 10.
  if (h === 'Log') {
    if (args.length === 1) return `log(${serializeExpression(args[0])}, 10)`;
    return `log(${serializeExpression(args[0])}, ${serializeExpression(args[1])})`;
  }
  if (h === 'Lb') return `log(${serializeExpression(args[0])}, 2)`;
  if (h === 'Lg') return `log(${serializeExpression(args[0])}, 10)`;

  // Comparisons (infix forms, except Equal/NotEqual which use Eq/Ne so
  // sympify treats them as symbolic equations rather than booleans).
  if (h === 'Equal') return `Eq(${serializeArgs(args)})`;
  if (h === 'NotEqual') return `Ne(${serializeArgs(args)})`;
  if (h === 'Less') return serializeInfix('<', args);
  if (h === 'Greater') return serializeInfix('>', args);
  if (h === 'LessEqual') return serializeInfix('<=', args);
  if (h === 'GreaterEqual') return serializeInfix('>=', args);

  // Calculus.
  if (h === 'Sum' || h === 'Product' || h === 'Integrate') {
    const name = h === 'Sum' ? 'Sum' : h === 'Product' ? 'Product' : 'Integral';
    const body = serializeExpression(unwrapIntegrand(args[0]));
    const tail = args.slice(1);
    const limits = tail
      .map((t) =>
        operator(t) === 'Limits' ? serializeLimits(t) : serializeExpression(t)
      )
      .filter((s): s is string => s !== null && s !== '');
    return `${name}(${[body, ...limits].join(', ')})`;
  }
  if (h === 'D' || h === 'Derivative' || h === 'PartialDerivative') {
    return `Derivative(${serializeArgs(args)})`;
  }

  // Direct rename table.
  if (h in FUNCTION_MAP) {
    return `${FUNCTION_MAP[h]}(${serializeArgs(args)})`;
  }

  // Generic fallback: pass the head and arguments through. SymPy's parser
  // will turn this into Function(h)(args).
  if (args.length === 0) return null;
  return `${h}(${serializeArgs(args)})`;
}

function serializeExpression(expr: Expression): string {
  return (
    serializeFunction(expr) ??
    serializeSymbol(expr) ??
    serializeNumber(expr) ??
    serializeString(expr) ??
    ''
  );
}

function serializeString(_expr: Expression): string | null {
  return null;
}

export function serialize(expr: Expression): string {
  try {
    return serializeExpression(expr);
  } catch (e) {
    console.error(e);
  }
  return '';
}
