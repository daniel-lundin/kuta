const hooks = ['before', 'after', 'beforeEach', 'afterEach'];
const cakesKeywords = ['Given', 'When', 'And', 'Then'];

function toLower(keyword) {
  return keyword[0].toLowerCase() + keyword.slice(1);
}

function arrayToLower(keywords) {
  return keywords.map(toLower);
}

export default function transformer(file, api) {
  const j = api.jscodeshift;

  function scopeLifecycles(fn, identifier) {
    const res = j(fn)
      .find(j.ExpressionStatement)
      .filter(path => path.parentPath.parentPath.parentPath.value === fn)
      .filter(path => hooks.indexOf(path.value.expression.callee.name) !== -1);

    res.forEach((path) => {
      const member = j.memberExpression(
        j.identifier(identifier),
        path.value.expression.callee
      )
      const expressionStmt = j.callExpression(member, path.value.expression.arguments)
      j(path).replaceWith(j.expressionStatement(expressionStmt));
    });
    return fn;
  }

  function arrowWithIt(fn) {
    return j.arrowFunctionExpression(
      [j.identifier('it')],
      scopeLifecycles(fn, 'it').body
    )
  }

  function createShorthandObject(props) {
    const shorthands = props.map((prop) => {
      const shorthandProp = j.property('init', j.identifier(prop), j.identifier(prop))
      shorthandProp.shorthand = true;
      return shorthandProp;
    });
    return j.objectPattern(shorthands);
  }

  const root = j(file.source);

  function addKutaImport(root, hasFeature, hasDescribe) {
    if (!hasFeature && !hasDescribe) {
      return;
    }
    const body = root.get().value.program.body;
    const importSpecifiers = [];
    if (hasFeature) {
      importSpecifiers.push(j.importSpecifier(j.identifier('feature'), j.identifier('feature')));
    }
    if (hasDescribe) {
      importSpecifiers.push(j.importSpecifier(j.identifier('describe'), j.identifier('describe')));
    }

    const kutaImport = j.importDeclaration(importSpecifiers, j.literal('kuta'));
    body.unshift(kutaImport);
  }

  let hasDescribe = false;
  let hasFeature = false;
  // Transforms describes...
  root
    .find(j.CallExpression)
    .forEach(path => {
      if (path.node.callee.name === 'describe') {
        hasDescribe = true;
        const callback = path.value.arguments[1];
        const updatedCallback = arrowWithIt(callback);
        const updatedDescribe = j.callExpression(j.identifier('describe'), [
          path.node.arguments[0],
          updatedCallback
        ]);
        j(path).replaceWith(updatedDescribe);
      }
    });

  // Transforms Feature('foo', () => {}) to feature('foo', ({ feature }) => { });
  root
    .find(j.CallExpression)
    .filter((path) => path.node.callee.name === 'Feature')
    .forEach((path) => {
      hasFeature = true;
      const callback = path.value.arguments[1];
      const featureShorthandProp = j.property('init', j.identifier('feature'), j.identifier('feature'))
      featureShorthandProp.shorthand = true;
      const newArrow = j.arrowFunctionExpression(
        [createShorthandObject(['feature'])],
        scopeLifecycles(callback, 'scenario').body
      );
      const updatedFeature = j.callExpression(
        j.identifier('feature'),
        [path.node.arguments[0], newArrow]
      );
      j(path).replaceWith(updatedFeature);
    });

  function getBddKeywords(fn) {
    const res = j(fn)
      .find(j.ExpressionStatement)
      .filter(path => path.parentPath.parentPath.parentPath.value === fn)
      .filter(path => cakesKeywords.concat(hooks).indexOf(path.value.expression.callee.name) !== -1)

    const keywords = new Set();
	res.forEach(path => {
      keywords.add(path.value.expression.callee.name);
    });
    return Array.from(keywords)
  }


  function decapitilizeBddKeywords(fn) {
    const res = j(fn)
      .find(j.ExpressionStatement)
      .filter(path => path.parentPath.parentPath.parentPath.value === fn)
      .filter(path => cakesKeywords.indexOf(path.value.expression.callee.name) !== -1)

    res.forEach((path) => {
      const name = path.value.expression.callee.name;
      path.value.expression.callee.name = toLower(name);
    });
    return fn;
  }

  root
    .find(j.CallExpression)
    .filter((path) => path.node.callee.name === 'Scenario')
    .forEach((path) => {
      const callback = path.value.arguments[1];
      const bddKeywords = getBddKeywords(callback);
      const newArrow = j.arrowFunctionExpression(
        [createShorthandObject(arrayToLower(bddKeywords))],
        decapitilizeBddKeywords(callback).body
      );
      const updatedScenario = j.callExpression(
        j.identifier('scenario'),
        [path.node.arguments[0], newArrow]
      );
      j(path).replaceWith(updatedScenario);
    });

  // Add imports
  addKutaImport(root, hasFeature, hasDescribe);
  return root.toSource({
    arrowParensAlways: true
  });
}

