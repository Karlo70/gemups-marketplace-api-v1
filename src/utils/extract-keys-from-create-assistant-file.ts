import * as ts from 'typescript';
import * as fs from 'fs';

const typesPath = './node_modules/@vapi-ai/server-sdk/api/types';

const getSourceFile = (name: string) => {
  const file = `${typesPath}/${name}.d.ts`;
  if (!fs.existsSync(file)) throw new Error(`Missing: ${file}`);
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
};

const resolveUnion = (node: ts.UnionTypeNode) => {
  const result = new Array(node.types.length);
  for (let i = 0; i < node.types.length; i++) {
    result[i] = resolveType(node.types[i]);
  }
  return result;
};

const resolveType = (type: ts.TypeNode): any => {
  switch (type.kind) {
    case ts.SyntaxKind.StringKeyword: return String;
    case ts.SyntaxKind.NumberKeyword: return Number;
    case ts.SyntaxKind.BooleanKeyword: return Boolean;
    case ts.SyntaxKind.ArrayType:
      return [resolveType((type as ts.ArrayTypeNode).elementType)];
    case ts.SyntaxKind.TypeReference: {
      const ref = (type as ts.TypeReferenceNode).typeName;
      const name = ts.isQualifiedName(ref) ? ref.right.text : ref.getText();
      try { return extractKeys(name).keyObject; } catch { return name; }
    }
    case ts.SyntaxKind.LiteralType: {
      const lit = (type as ts.LiteralTypeNode).literal;
      if (ts.isStringLiteral(lit)) return lit.text;
      if (ts.isNumericLiteral(lit)) return +lit.text;
      if (lit.kind === ts.SyntaxKind.TrueKeyword) return true;
      if (lit.kind === ts.SyntaxKind.FalseKeyword) return false;
      return 'unknown_literal';
    }
    case ts.SyntaxKind.UnionType:
      return resolveUnion(type as ts.UnionTypeNode);
    default:
      return 'unknown';
  }
};

export const extractKeys = (interfaceName: string) => {
  const name = interfaceName.split('.')[1]?.replace('[]', '') || interfaceName;
  const keys: string[] = [];
  const values: any[] = [];
  const keyObject: Record<string, any> = {};
  let found = false;

  try {
    const file = getSourceFile(name);

    const handle = (members: ts.NodeArray<ts.TypeElement>) => {
      for (let m of members) {
        if (ts.isPropertySignature(m) && ts.isIdentifier(m.name) && m.type) {
          const key = m.name.text;
          const required = !m.questionToken;
          const resolved = resolveType(m.type);
          keys.push(key);
          values.push(resolved);
          keyObject[key] = { type: resolved, required };
        }
      }
    };

    for (const node of file.statements) {
      if (
        ts.isTypeAliasDeclaration(node) &&
        node.name.text === name
      ) {
        if (ts.isUnionTypeNode(node.type)) {
          const variants = resolveUnion(node.type);
          keyObject.variants = variants;
          values.push(...variants);
          found = true;
          break;
        } else if (ts.isTypeLiteralNode(node.type)) {
          handle(node.type.members);
          found = true;
          break;
        }
      } else if (
        ts.isInterfaceDeclaration(node) &&
        node.name.text === name
      ) {
        handle(node.members);
        found = true;
        break;
      }
    }

    return found ? { keys, keyObject, values } : { keys: [], keyObject: {}, values: [] };
  } catch (err) {
    return err;
  }
};