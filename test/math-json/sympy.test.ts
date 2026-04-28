import { ComputeEngine } from '../../src/compute-engine';
import { parse } from '../../src/math-json/parse-sympy';
import { serialize } from '../../src/math-json/serialize-sympy';

const ce = new ComputeEngine();

describe('Sympy parsing identifiers', () => {
  test('abcde_fgh9', () => {
    expect(parse('abcde_fgh9')).toMatchInlineSnapshot(`"abcde_fgh9"`);
  });
  test('_890', () => {
    expect(parse('_890')).toMatchInlineSnapshot(`"_890"`);
  });
  test('a234_890_', () => {
    expect(parse('a234_890_')).toMatchInlineSnapshot(`"a234_890_"`);
  });
  test('a123456', () => {
    expect(parse('a123456')).toMatchInlineSnapshot(`"a123456"`);
  });
});
describe('Sympy parsing unicode identifiers', () => {
  test('Unicode Identifiers', () => {
    expect(parse('abcde_fgh9')).toMatchInlineSnapshot(`"abcde_fgh9"`);
  });
});
describe('Sympy parsing integers', () => {
  test.skip('0', () => expect(parse('0')).toEqual(0));
  test('123', () => expect(parse('123')).toEqual(123));
  test('123_456', () => expect(parse('123_456')).toEqual(123456));
  test('0b0010', () => expect(parse('0b0010')).toEqual(['BaseForm', 2, 2]));
  test('0b00_10', () => expect(parse('0b00_10')).toEqual(['BaseForm', 2, 2]));
  test('0o0777', () => expect(parse('0o0777')).toEqual(['BaseForm', 511, 8]));
  test('0Xdead_BEEF', () =>
    expect(parse('0Xdead_BEEF')).toEqual(['BaseForm', 3735928559, 16]));
});

describe('Sympy parsing floatnumber', () => {
  test('10.', () => {
    expect(parse('10.')).toEqual(10);
  });
  test('.001', () => {
    expect(parse('.001')).toEqual(0.001);
  });
  test('1.345', () => {
    expect(parse('1.345')).toEqual(1.345);
  });
  test('1_23_45.678', () => {
    expect(parse('1_23_45.678')).toEqual(12345.678);
  });
  test('.1_23_45678', () => {
    expect(parse('.1_23_45678')).toEqual(0.12345678);
  });
  test('1.e10', () => {
    expect(parse('1.e10')).toEqual(10000000000);
  });
  test('2e+5', () => {
    expect(parse('2e+5')).toEqual(200000);
  });
  test('2.0e-5', () => {
    expect(parse('2.0e-5')).toEqual(0.00002);
  });
  test('.4e-6_7', () => {
    expect(parse('.4e-6_7')).toEqual(4e-68);
  });
  test.skip('077e010', () => {
    expect(parse('077e010')).toEqual(770000000000);
  });
  test.skip('0e0', () => {
    expect(parse('0e0')).toEqual(0);
  });
});

describe('Sympy parsing Imaginary literals', () => {
  test('5j', () => expect(parse('5j')).toEqual(['Complex', 0, 5]));
  test('-5j', () => expect(parse('4j')).toEqual(['Complex', 0, 4]));
  test('3.14j', () => expect(parse('3.14j')).toEqual(['Complex', 0, 3.14]));
  test('10.j', () => {
    expect(parse('10.j')).toEqual(['Complex', 0, 10]);
  });
  test('0.001J', () => {
    expect(parse('0.001J')).toEqual(['Complex', 0, 0.001]);
  });
  test('3.14e-10J', () => {
    expect(parse('3.14e-10J')).toEqual(['Complex', 0, 3.14e-10]);
  });
  test('3.14_15_93j', () => {
    expect(parse('3.14_15_93j')).toEqual(['Complex', 0, 3.141593]);
  });
});

describe('Sympy parsing Numeric expressions', () => {
  test('2**2 / 3 + 5', () => {
    expect(parse('2**2 / 3 + 5')).toMatchInlineSnapshot(`
      [
        "Error",
        {
          "str": "unexpected-token",
        },
        {
          "str": "**2 / 3 + 5",
        },
      ]
    `);
  });
  test('-2*(-(-x + 1/x)/(x*(x - 1/x)**2) - 1/(x*(x - 1/x))) - 1', () => {
    expect(parse('-2*(-(-x + 1/x)/(x*(x - 1/x)**2) - 1/(x*(x - 1/x))) - 1'))
      .toMatchInlineSnapshot(`
      [
        "Error",
        {
          "str": "unexpected-token",
        },
        {
          "str": "-2*(-(-x + 1/x)/(x*(x - 1/x)**2) - 1/(x*(x - 1/x))) - 1",
        },
      ]
    `);
  });
});

// sin(2*x) - 2*sin(x)*cos(x)

// x = r*(sympy.cos(theta)*gamma_z+sympy.sin(theta)*\
//        (sympy.cos(phi)*gamma_x+sympy.sin(phi)*gamma_y))

// sympify(sympy.sin(x/3))

describe('Sympy serializing numbers', () => {
  test('', () => {
    expect(serialize({ num: '1234.567' })).toMatchInlineSnapshot(`"1234.567"`);
  });
  test('', () => {
    expect(serialize({ num: '0.123' })).toMatchInlineSnapshot(`"0.123"`);
  });
  test('', () => {
    expect(serialize({ num: '-1234e-45' })).toMatchInlineSnapshot(
      `"-1.234e-42"`
    );
  });
  test('', () => {
    expect(serialize({ num: 'NaN' })).toMatchInlineSnapshot(`"NaN"`);
  });
  test('', () => {
    expect(serialize({ num: '-Infinity' })).toMatchInlineSnapshot(
      `"-Infinity"`
    );
  });
});

describe('Sympy serializing Baseform', () => {
  test('', () => {
    expect(serialize(['BaseForm', 42, 2])).toMatchInlineSnapshot(`"0b101010"`);
  });
  test('', () => {
    expect(serialize(['BaseForm', 42, 8])).toMatchInlineSnapshot(`"0o52"`);
  });
  test('', () => {
    expect(serialize(['BaseForm', 3735929054, 16])).toMatch('0xdeadc0de');
  });
  test('', () => {
    expect(serialize(['BaseForm', 42, 10])).toMatch('42');
  });
  test('', () => {
    expect(serialize(['BaseForm', 42, 7])).toMatch('42');
  });
  test('', () => {
    expect(serialize(['BaseForm', 42])).toMatch('42');
  });
  test('', () => {
    expect(serialize(['BaseForm'])).toMatchInlineSnapshot(`""`);
  });
  test('', () => {
    expect(serialize(['BaseForm', -32, 10])).toMatchInlineSnapshot(
      `"BaseForm(-32, 10)"`
    );
  });
  test('', () => {
    expect(serialize(['BaseForm', 'foo', 10])).toMatchInlineSnapshot(
      `"BaseForm(foo, 10)"`
    );
  });
});

describe('Sympy serializing symbols', () => {
  test('x', () => expect(serialize('x')).toMatchInlineSnapshot(`"x"`));
  test('speed', () =>
    expect(serialize('speed')).toMatchInlineSnapshot(`"speed"`));
  test('alpha', () =>
    expect(serialize('alpha')).toMatchInlineSnapshot(`"alpha"`));
  test('alpha_12', () =>
    expect(serialize('alpha_12')).toMatchInlineSnapshot(`"alpha_12"`));
});

describe('Sympy serializing arithmetic operators', () => {
  test('Add binary', () =>
    expect(serialize(['Add', 5, 6])).toMatchInlineSnapshot(`"(5 + 6)"`));
  test('Add ternary', () =>
    expect(serialize(['Add', 'x', 'y', 'z'])).toMatchInlineSnapshot(
      `"(x + y + z)"`
    ));
  test('Add with Negate (canonical Subtract form)', () =>
    expect(serialize(['Add', 'x', ['Negate', 'y']])).toMatchInlineSnapshot(
      `"(x + (-y))"`
    ));
  test('Subtract', () =>
    expect(serialize(['Subtract', 'a', 'b'])).toMatchInlineSnapshot(
      `"(a - b)"`
    ));
  test('Negate', () =>
    expect(serialize(['Negate', 'x'])).toMatchInlineSnapshot(`"(-x)"`));
  test('Multiply', () =>
    expect(serialize(['Multiply', 3, 'x'])).toMatchInlineSnapshot(`"(3*x)"`));
  test('Multiply n-ary', () =>
    expect(serialize(['Multiply', 'a', 'b', 'c'])).toMatchInlineSnapshot(
      `"(a*b*c)"`
    ));
  test('Divide', () =>
    expect(serialize(['Divide', 'a', 'b'])).toMatchInlineSnapshot(`"(a/b)"`));
  test('Power', () =>
    expect(serialize(['Power', 'x', 2])).toMatchInlineSnapshot(`"(x**2)"`));
  test('Square', () =>
    expect(serialize(['Square', 'x'])).toMatchInlineSnapshot(`"(x**2)"`));
  test('Sqrt', () =>
    expect(serialize(['Sqrt', 'x'])).toMatchInlineSnapshot(`"sqrt(x)"`));
  test('Root', () =>
    expect(serialize(['Root', 'x', 3])).toMatchInlineSnapshot(
      `"((x)**(1/3))"`
    ));
  test('Power of ExponentialE becomes exp', () =>
    expect(serialize(['Power', 'ExponentialE', 'x'])).toMatchInlineSnapshot(
      `"exp(x)"`
    ));
  test('Exp', () =>
    expect(serialize(['Exp', 'x'])).toMatchInlineSnapshot(`"exp(x)"`));

  test('3x^2 + 4x + c', () =>
    expect(
      serialize([
        'Add',
        ['Multiply', 3, ['Square', 'x']],
        ['Multiply', 4, 'x'],
        'c',
      ])
    ).toMatchInlineSnapshot(`"((3*(x**2)) + (4*x) + c)"`));
});

describe('Sympy serializing constants', () => {
  test('Pi', () => expect(serialize('Pi')).toMatchInlineSnapshot(`"pi"`));
  test('ExponentialE', () =>
    expect(serialize('ExponentialE')).toMatchInlineSnapshot(`"E"`));
  test('ImaginaryUnit', () =>
    expect(serialize('ImaginaryUnit')).toMatchInlineSnapshot(`"I"`));
  test('Complex(0,1) shorthand for i', () =>
    expect(serialize(['Complex', 0, 1])).toMatchInlineSnapshot(`"I"`));
  test('PositiveInfinity', () =>
    expect(serialize('PositiveInfinity')).toMatchInlineSnapshot(`"oo"`));
  test('NegativeInfinity', () =>
    expect(serialize('NegativeInfinity')).toMatchInlineSnapshot(`"-oo"`));
  test('Infinity', () =>
    expect(serialize('Infinity')).toMatchInlineSnapshot(`"oo"`));
  test('NaN as symbol', () =>
    expect(serialize('NaN')).toMatchInlineSnapshot(`"nan"`));
  test('True', () => expect(serialize('True')).toMatchInlineSnapshot(`"True"`));
  test('False', () =>
    expect(serialize('False')).toMatchInlineSnapshot(`"False"`));
  test('Half', () =>
    expect(serialize('Half')).toMatchInlineSnapshot(`"Rational(1, 2)"`));
});

describe('Sympy serializing trig functions', () => {
  test('Sin', () =>
    expect(serialize(['Sin', 'x'])).toMatchInlineSnapshot(`"sin(x)"`));
  test('Cos', () =>
    expect(serialize(['Cos', 'x'])).toMatchInlineSnapshot(`"cos(x)"`));
  test('Tan', () =>
    expect(serialize(['Tan', 'x'])).toMatchInlineSnapshot(`"tan(x)"`));
  test('Cot', () =>
    expect(serialize(['Cot', 'x'])).toMatchInlineSnapshot(`"cot(x)"`));
  test('Sec', () =>
    expect(serialize(['Sec', 'x'])).toMatchInlineSnapshot(`"sec(x)"`));
  test('Csc', () =>
    expect(serialize(['Csc', 'x'])).toMatchInlineSnapshot(`"csc(x)"`));
  test('Arcsin', () =>
    expect(serialize(['Arcsin', 'x'])).toMatchInlineSnapshot(`"asin(x)"`));
  test('Arccos', () =>
    expect(serialize(['Arccos', 'x'])).toMatchInlineSnapshot(`"acos(x)"`));
  test('Arctan', () =>
    expect(serialize(['Arctan', 'x'])).toMatchInlineSnapshot(`"atan(x)"`));
  test('Sinh', () =>
    expect(serialize(['Sinh', 'x'])).toMatchInlineSnapshot(`"sinh(x)"`));
  test('Cosh', () =>
    expect(serialize(['Cosh', 'x'])).toMatchInlineSnapshot(`"cosh(x)"`));
  test('Tanh', () =>
    expect(serialize(['Tanh', 'x'])).toMatchInlineSnapshot(`"tanh(x)"`));
  test('Arsinh', () =>
    expect(serialize(['Arsinh', 'x'])).toMatchInlineSnapshot(`"asinh(x)"`));
});

describe('Sympy serializing log functions', () => {
  test('Ln', () =>
    expect(serialize(['Ln', 'x'])).toMatchInlineSnapshot(`"log(x)"`));
  test('Log default base 10', () =>
    expect(serialize(['Log', 'x'])).toMatchInlineSnapshot(`"log(x, 10)"`));
  test('Log explicit base', () =>
    expect(serialize(['Log', 'x', 2])).toMatchInlineSnapshot(`"log(x, 2)"`));
});

describe('Sympy serializing rounding/abs', () => {
  test('Abs', () =>
    expect(serialize(['Abs', 'x'])).toMatchInlineSnapshot(`"Abs(x)"`));
  test('Abs nested', () =>
    expect(
      serialize(['Abs', ['Add', ['Abs', 'x'], 'y']])
    ).toMatchInlineSnapshot(`"Abs((Abs(x) + y))"`));
  test('Floor', () =>
    expect(serialize(['Floor', 'x'])).toMatchInlineSnapshot(`"floor(x)"`));
  test('Ceil', () =>
    expect(serialize(['Ceil', 'x'])).toMatchInlineSnapshot(`"ceiling(x)"`));
});

describe('Sympy serializing comparisons', () => {
  test('Equal', () =>
    expect(serialize(['Equal', 'x', 'y'])).toMatchInlineSnapshot(`"Eq(x, y)"`));
  test('NotEqual', () =>
    expect(serialize(['NotEqual', 'x', 'y'])).toMatchInlineSnapshot(
      `"Ne(x, y)"`
    ));
  test('Less', () =>
    expect(serialize(['Less', 'x', 'y'])).toMatchInlineSnapshot(`"(x < y)"`));
  test('Greater', () =>
    expect(serialize(['Greater', 'x', 'y'])).toMatchInlineSnapshot(
      `"(x > y)"`
    ));
  test('LessEqual', () =>
    expect(serialize(['LessEqual', 'x', 'y'])).toMatchInlineSnapshot(
      `"(x <= y)"`
    ));
  test('GreaterEqual', () =>
    expect(serialize(['GreaterEqual', 'x', 'y'])).toMatchInlineSnapshot(
      `"(x >= y)"`
    ));
});

describe('Sympy serializing logical', () => {
  test('And', () =>
    expect(serialize(['And', 'p', 'q'])).toMatchInlineSnapshot(`"And(p, q)"`));
  test('Or', () =>
    expect(serialize(['Or', 'p', 'q'])).toMatchInlineSnapshot(`"Or(p, q)"`));
  test('Not', () =>
    expect(serialize(['Not', 'p'])).toMatchInlineSnapshot(`"Not(p)"`));
});

describe('Sympy serializing greek and subscripts', () => {
  test('alpha passthrough', () =>
    expect(serialize('alpha')).toMatchInlineSnapshot(`"alpha"`));
  test('Gamma passthrough', () =>
    expect(serialize('Gamma')).toMatchInlineSnapshot(`"Gamma"`));
  test('subscripted symbol (already merged by compute-engine)', () =>
    expect(serialize('x_i')).toMatchInlineSnapshot(`"x_i"`));
  test('multi-char subscript', () =>
    expect(serialize('var_test')).toMatchInlineSnapshot(`"var_test"`));
});

describe('Sympy serializing calculus', () => {
  test('Sum with Limits', () =>
    expect(
      serialize(['Sum', 'n', ['Limits', 'n', 1, 10]])
    ).toMatchInlineSnapshot(`"Sum(n, (n, 1, 10))"`));
  test('Sum body expression', () =>
    expect(
      serialize(['Sum', ['Multiply', 'n', 'x'], ['Limits', 'n', 1, 10]])
    ).toMatchInlineSnapshot(`"Sum((n*x), (n, 1, 10))"`));
  test('Product with Limits', () =>
    expect(
      serialize(['Product', 'n', ['Limits', 'n', 1, 10]])
    ).toMatchInlineSnapshot(`"Product(n, (n, 1, 10))"`));
  test('Definite Integral with Limits', () =>
    expect(
      serialize(['Integrate', 'x', ['Limits', 'x', 0, 1]])
    ).toMatchInlineSnapshot(`"Integral(x, (x, 0, 1))"`));
  test('Definite Integral edge case', () => {
    expect(serialize(ce.parse('\\int_0^1 x^2dx').json)).toMatchInlineSnapshot(
      `"Integral((x**2), (x, 0, 1))"`
    );
  });
  test('Indefinite Integral with postfix dx (Function/Block wrapper)', () => {
    expect(serialize(ce.parse('\\int x^2 dx').json)).toMatchInlineSnapshot(
      `"Integral((x**2), x)"`
    );
  });
  test('Definite Integral compound integrand', () => {
    expect(
      serialize(ce.parse('\\int_0^1 (x^2 + 1) dx').json)
    ).toMatchInlineSnapshot(`"Integral(((x**2) + 1), (x, 0, 1))"`);
  });
  test('Definite Integral with trig integrand', () => {
    expect(
      serialize(ce.parse('\\int_0^{\\pi} \\cos(2x) dx').json)
    ).toMatchInlineSnapshot(`"Integral(cos((2*x)), (x, 0, pi))"`);
  });
  test('Definite Integral with exp integrand', () => {
    expect(
      serialize(ce.parse('\\int_0^1 e^{x^2} dx').json)
    ).toMatchInlineSnapshot(`"Integral(exp((x**2)), (x, 0, 1))"`);
  });
  test('Sum of definite integrals (nested calculus heads)', () => {
    expect(
      serialize(ce.parse('\\sum_{n=1}^{10} \\int_0^1 x^n dx').json)
    ).toMatchInlineSnapshot(`"Sum(Integral((x**n), (x, 0, 1)), (n, 1, 10))"`);
  });
  test('manually-built nested Function/Block layers are flattened', () => {
    expect(
      serialize([
        'Integrate',
        ['Function', ['Block', ['Function', ['Block', 'x'], 'x']], 'x'],
        ['Limits', 'x', 0, 1],
      ])
    ).toMatchInlineSnapshot(`"Integral(x, (x, 0, 1))"`);
  });
  // Multi-statement Block is not exercised: compute-engine's LaTeX parser
  // never emits one as a calculus integrand, and SymPy has no Block
  // primitive — sympify("Block(a, b)") would be parsed as an unknown
  // user-defined function, not something usable downstream.
  test('Indefinite Integral (Limits with Nothing bounds)', () =>
    expect(
      serialize(['Integrate', 'x', ['Limits', 'x', 'Nothing', 'Nothing']])
    ).toMatchInlineSnapshot(`"Integral(x, x)"`));
  test('Derivative D', () =>
    expect(serialize(['D', ['Power', 'x', 2], 'x'])).toMatchInlineSnapshot(
      `"Derivative((x**2), x)"`
    ));
  test('Derivative D multiple vars', () =>
    expect(serialize(['D', 'f', 'x', 'y'])).toMatchInlineSnapshot(
      `"Derivative(f, x, y)"`
    ));
});

describe('Sympy serializing unknown functions', () => {
  test('unknown function passthrough', () =>
    expect(serialize(['MyFn', 'x', 'y'])).toMatchInlineSnapshot(
      `"MyFn(x, y)"`
    ));
});

describe('Sympy round-trip from LaTeX', () => {
  const cases: Array<[string, string]> = [
    ['x + y', '(x + y)'],
    ['x - y', '(x + (-y))'],
    ['-x', '(-x)'],
    ['2 \\cdot x', '(2*x)'],
    ['\\frac{1}{2}', 'Rational(1, 2)'],
    ['\\frac{a}{b}', '(a/b)'],
    ['x^2', '(x**2)'],
    ['\\sqrt{x}', 'sqrt(x)'],
    ['\\sqrt[3]{x}', '((x)**(1/3))'],
    ['|x|', 'Abs(x)'],
    ['\\sin(x)', 'sin(x)'],
    ['\\cos x', 'cos(x)'],
    ['\\arcsin x', 'asin(x)'],
    ['\\sinh x', 'sinh(x)'],
    ['\\ln x', 'log(x)'],
    ['\\log_2(x)', 'log(x, 2)'],
    ['\\log(x)', 'log(x, 10)'],
    ['e^x', 'exp(x)'],
    ['\\exp(x)', 'exp(x)'],
    ['\\lfloor x \\rfloor', 'floor(x)'],
    ['\\lceil x \\rceil', 'ceiling(x)'],
    ['\\pi', 'pi'],
    ['\\infty', 'oo'],
    ['-\\infty', '-oo'],
    ['x = y', 'Eq(x, y)'],
    ['x < y', '(x < y)'],
    ['x \\le y', '(x <= y)'],
    ['x \\ne y', 'Ne(x, y)'],
    ['\\alpha', 'alpha'],
    ['x_i', 'x_i'],
    ['x_{test}', 'x_test'],
    ['x2', '(2*x)'],
    ['2x + 3y', '((2*x) + (3*y))'],
    ['\\sum_{n=1}^{10} n', 'Sum(n, (n, 1, 10))'],
    ['\\int_0^1 x \\, dx', 'Integral(x, (x, 0, 1))'],
    ['\\int x \\, dx', 'Integral(x, x)'],
  ];

  for (const [latex, expected] of cases) {
    test(`${latex} -> ${expected}`, () => {
      const expr = ce.parse(latex).json;
      expect(serialize(expr)).toBe(expected);
    });
  }
});

describe('BoxedExpression.sympy getter', () => {
  test('matches free-function serialize on the same json', () => {
    const expr = ce.parse('\\frac{1}{2} + \\sin(x)');
    expect(expr.sympy).toBe(serialize(expr.json));
  });
  test('basic arithmetic round-trip', () => {
    expect(ce.parse('x + 1').sympy).toMatchInlineSnapshot(`"(x + 1)"`);
  });
  test('rational + trig (canonical reordering)', () => {
    // Canonical form sorts terms; trig comes before the constant.
    expect(ce.parse('\\frac{1}{2} + \\sin(x)').sympy).toMatchInlineSnapshot(
      `"(sin(x) + Rational(1, 2))"`
    );
  });
  test('exp shorthand', () => {
    expect(ce.parse('e^x').sympy).toMatchInlineSnapshot(`"exp(x)"`);
  });
});
