﻿import CodeBlockWriter from "code-block-writer";
import {getFlattenedExtensions} from "./common";
import {Structure} from "./inspectors";

// todo: a lot of this code was written before this library supported manipulation
export function createGetStructureFunctions(structures: Structure[]) {
    const writer = new CodeBlockWriter();

    writer.writeLine("/* tslint:disable */");
    writer.writeLine("// DO NOT MANUALLY EDIT!! File generated via: npm run code-generate").newLine();
    writer.writeLine(`import * as objectAssign from "object-assign";`);
    writer.writeLine(`import * as compiler from "./../../compiler";`);
    writer.writeLine(`import * as structures from "./../../structures";`);
    writer.writeLine(`import * as getMixinStructureFuncs from "./getMixinStructureFunctions";`);

    for (const structure of structures.filter(s => shouldCreateForStructure(s.getName()))) {
        writer.newLine();
        write(writer, structure);
    }

    return writer.toString();
}

// todo: make this better... good enough for now
// for example, it would be better to be able to get the structure from a node and specify what structures to ignore when calling it... that way the logic could be kept inside
// the application and not here (basically... have a fromFunctionDeclaration(node, [nameof(ParameteredNodeStructure)]);)
function write(writer: CodeBlockWriter, structure: Structure) {
    const className = structure.getName().replace(/Structure$/, "");
    const functionHeader = `export function from${className}(node: compiler.${className.replace("Overload", "")}): structures.${structure.getName()}`;
    writer.write(functionHeader).block(() => {
        writeBody(writer, structure, structure.getDescendantBaseStructures().filter(b => shouldAllowExtends(structure, b)));
    });
}

function writeBody(writer: CodeBlockWriter, structure: Structure, baseStructures: Structure[]) {
    writer.writeLine(`let structure: structures.${structure.getName()} = {} as any;`);
    for (const extendsStructure of baseStructures) {
        writer.write("objectAssign(structure, ");
        writer.write("getMixinStructureFuncs.");
        const extendsClassName = extendsStructure.getName().replace(/Structure$/, "");
        writer.write(`from${extendsClassName}(node));`).newLine();
    }
    writer.writeLine("return structure;");
}

function shouldCreateForStructure(name: string) {
    switch (name) {
        case "FunctionDeclarationOverloadStructure":
        case "MethodDeclarationOverloadStructure":
        case "ConstructorDeclarationOverloadStructure":
            return true;
        default:
            return false;
    }
}

function shouldAllowExtends(structure: Structure, baseStructure: Structure) {
    if (structure.getName() === "FunctionDeclarationOverloadStructure") {
        switch (baseStructure.getName()) {
            case "ParameteredNodeStructure":
            case "TypeParameteredNodeStructure":
            case "JSDocableNodeStructure":
            case "SignaturedDeclarationStructure":
            case "ReturnTypedNodeStructure":
            case "GeneratorableNodeStructure":
            case "AsyncableNodeStructure":
                return false;
            default:
                return true;
        }
    }
    else if (structure.getName() === "MethodDeclarationOverloadStructure") {
        switch (baseStructure.getName()) {
            case "ParameteredNodeStructure":
            case "TypeParameteredNodeStructure":
            case "JSDocableNodeStructure":
            case "SignaturedDeclarationStructure":
            case "ReturnTypedNodeStructure":
            case "GeneratorableNodeStructure":
            case "AsyncableNodeStructure":
            case "DecoratableNodeStructure":
                return false;
            default:
                return true;
        }
    }
    else if (structure.getName() === "ConstructorDeclarationOverloadStructure") {
        switch (baseStructure.getName()) {
            case "ParameteredNodeStructure":
            case "TypeParameteredNodeStructure":
            case "JSDocableNodeStructure":
            case "SignaturedDeclarationStructure":
            case "ReturnTypedNodeStructure":
                return false;
            default:
                return true;
        }
    }
    return true;
}
