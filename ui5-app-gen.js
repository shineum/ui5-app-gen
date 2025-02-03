const fs = require('fs');
const path = require('path');
const readline = require('node:readline');
var JSZip = require("jszip");

const getAppMappings = () => {
    return {
        "APP_NAME": "demo-app",
        "APP_ID": "com.example.demo",
        "APP_TITLE": "Demo App",
        "APP_THEME": "sap_fiori_3",
        "APP_VERSION": "0.0.1",
        "UI5_MIN_VERSION": "1.120.25",
        "UI5_VERSION": "1.120.25"
    }
};

////////////////////////////////////

const FILE_APP_CONTROLLER =
    `sap.ui.define([
    "sap/ui/Device",
    "sap/ui/core/mvc/Controller",
], (Device, Controller) => {
    "use strict";
    return Controller.extend("{{APP_ID}}.controller.App", {
        onInit() {
        }
    });
});`;

const FILE_APP_VIEW =
    `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:core="sap.ui.core" xmlns="sap.m" xmlns:f="sap.f" controllerName="{{APP_ID}}.controller.App" displayBlock="true">
		<App>
			<Page>
				<customHeader>
				</customHeader>
				<content>
					<f:DynamicPage>
						<f:header>
						</f:header>
						<f:content>
                            <Text text="Hello World!"></Text>
						</f:content>
					</f:DynamicPage>
				</content>
				<footer>
				</footer>
			</Page>
		</App>
</mvc:View>`;

const FILE_APP_COMPONENT =
    `sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/ComponentSupport"
], (UIComponent, ComponentSupport) => {
	"use strict";
	return UIComponent.extend("{{APP_ID}}.Component", {
		metadata: {
			manifest: "json",
			interfaces: ["sap.ui.core.IAsyncContentCreation"],
		}
	});
});`;

const FILE_APP_INDEX =
    `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{APP_TITLE}}</title>
        <link rel="icon" type="image/x-icon" href="favicon.ico">
        <script id="sap-ui-bootstrap"
            src="resources/sap-ui-core.js"
            data-sap-ui-libs="sap.m"
            data-sap-ui-xx-wait-for-theme="true"
            data-sap-ui-theme="{{APP_THEME}}"
            data-sap-ui-resource-roots='{
                "{{APP_ID}}": "./"
            }'
            data-sap-ui-on-init="module:sap/ui/core/ComponentSupport"
            data-sap-ui-compat-version="edge"
            data-sap-ui-async="true">
        </script>
    </head>
    <body class="sapUiBody">
        <div data-sap-ui-component data-name="{{APP_ID}}" data-id="container"></div>
    </body>
</html>`;

const FILE_APP_MANIFEST =
    `{
    "_version": "{{APP_VERSION}}",
    "sap.app": {
        "id": "{{APP_ID}}",
        "type": "application"
    },
    "sap.ui5": {
        "dependencies": {
            "minUI5Version": "{{UI5_MIN_VERSION}}",
            "libs": {
                "sap.ui.core": {},
                "sap.m": {},
                "sap.f": {}
            }
        },
        "rootView": {
            "viewName": "{{APP_ID}}.view.App",
            "type": "XML",
            "id": "app"
        },
        "models": {
            "i18n": {
                "type": "sap.ui.model.resource.ResourceModel",
                "settings": {
                    "bundleName": "{{APP_ID}}.i18n.i18n",
                    "async": true
                }
            }
        },
        "resources": {
            "css": [
                {
                    "uri": "css/styles.css"
                }
            ]
        }
    }
}`;

const FILE_PACKAGE =
    `{
  "name": "{{APP_NAME}}",
  "version": "{{APP_VERSION}}",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "ui5 serve",
    "build": "ui5 build",
    "test": "echo \\\"Error: no test specified\\\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}`;

const FILE_UI5 =
    `specVersion: "4.0"
metadata:
  name: {{APP_NAME}}
type: application
framework:
  name: OpenUI5
  version: "{{UI5_VERSION}}"
  libraries:
    - name: sap.f
    - name: sap.m
    - name: sap.ui.core
    - name: sap.ui.table
    - name: themelib_sap_fiori_3
      optional: true    
`;

const FILE_README =
    `# Quick Start

##
## 0. Pre-requisite
install node.js 22.12.0 or later

##
## 1. Install UI5 module globally
\`\`\`
npm install --global @ui5/cli
\`\`\`

##
## 2. Start ui5 app
\`\`\`
npm start
\`\`\`
`;

const FILE_GITIGNORE = 
    `dist
node_modules`

////////////////////////////////////

const appFiles = {
    "webapp": {
        "controller": {
            "App.controller.js": FILE_APP_CONTROLLER
        },
        "view": {
            "App.view.xml": FILE_APP_VIEW
        },
        "css": {
            "styles.css": "/* css */"
        },
        "i18n": {
            "i18n_en_US.properties": "#",
            "i18n.properties": "#",
        },
        "Component.js": FILE_APP_COMPONENT,
        "index.html": FILE_APP_INDEX,
        "manifest.json": FILE_APP_MANIFEST
    },
    "package.json": FILE_PACKAGE,
    "ui5.yaml": FILE_UI5,
    "readme.md": FILE_README,
    ".gitignore": FILE_GITIGNORE,
};

class UI5AppGen {
    static getAppMappings = getAppMappings;

    constructor(pAppMapping = null, pRootDir = `${process.cwd()}/dist`) {
        this.appMappings = pAppMapping || getAppMappings();
        this.rootDir = pRootDir;
        this.__initActions();
    }

    __initActions() {
        this.actionListFolder = [];
        this.actionListFile = [];
    }

    __actionAdd(pPath, pContent = null) {
        if (pContent) {
            this.actionListFile.push({"fp": pPath, "data": pContent});
        } else {
            this.actionListFolder.push({"fp": pPath});
        }
    }
    
    __traverse(pDict = {}, pPathList = []) {
        Object.keys(pDict).forEach((pKey) => {
            let tTypeStr = typeof (pDict[pKey]);
            let tObjPath = path.join(...pPathList, pKey);
            if (tTypeStr == 'object') {
                this.__actionAdd(tObjPath);
                pPathList.push(pKey);
                this.__traverse(pDict[pKey], pPathList);
                pPathList.pop();
            } else if (tTypeStr == 'string') {
                let tFileContent = pDict[pKey];
                Object.entries(this.appMappings).forEach((pEntry) => {
                    tFileContent = tFileContent.replaceAll(`{{${pEntry[0]}}}`, pEntry[1]);
                });
                this.__actionAdd(tObjPath, tFileContent);
            }
        });
    }

    __handleInput(pArr, pIdx = 0, pCallback = null) {
        if (pIdx == -1 || pArr.length <= pIdx) {
            this.__traverse(appFiles);
            pCallback && pCallback();
        } else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const pKey = pArr[pIdx];
            const pText = this.appMappings[pKey];
            const q = `Enter ${pKey} [${pText}]:\n>> `;
            rl.question(q, (pInput) => {
                this.appMappings[pKey] = pInput || pText;
                console.log(`${pKey}: ${this.appMappings[pKey]}`);
                rl.close();
                this.__handleInput(pArr, pIdx + 1, pCallback);
            });
        }
    }

    __setBuffer(pInteracitve = false, pCallback = null) {
        let tMappingKeys = Object.keys(this.appMappings);
        this.__initActions();
        this.__handleInput(tMappingKeys, pInteracitve ? 0 : tMappingKeys.length, pCallback);
    }

    __createArtifacts(pRootDir = null) {
        this.actionListFolder.forEach((pObj) => {
            let tPath = pRootDir ? path.join(pRootDir, pObj.fp) : pObj.fp;
            fs.mkdirSync(tPath, {recursive: true}, (err) => { });
        });
        this.actionListFile.forEach((pObj) => {
            let tPath = pRootDir ? path.join(pRootDir, pObj.fp) : pObj.fp;
            fs.writeFile(tPath, pObj.data, 'utf8', (err) => {});
        });
    }

    __createZipArtifacts() {
        let tZip = new JSZip();
        this.actionListFile.forEach((pObj) => {
            tZip.file(pObj.fp, pObj.data);
        });
        const fos = fs.createWriteStream(`${process.cwd()}/${this.appMappings.APP_NAME}.zip`);
        tZip.generateNodeStream({ type: "nodebuffer", streamFiles: true }).pipe(fos);
    }

    create() {
        this.__setBuffer(false, () => { this.__createArtifacts(this.rootDir); });
    }

    createZip() {
        this.__setBuffer(false, () => { this.__createZipArtifacts(); });
    }

    createInteractively() {
        this.__setBuffer(true, () => { this.__createArtifacts(this.rootDir); });
    }

    createZipInteractively() {
        this.__setBuffer(true, () => { this.__createZipArtifacts(); });
    }

    sendZipStream(pRes) {
        this.__setBuffer(false, () => {
            let tZip = new JSZip();
            this.actionListFile.forEach((pObj) => {
                tZip.file(pObj.fp, pObj.data);
            });
            pRes.contentType("application/zip");
            pRes.type('.zip');
            pRes.setHeader('Content-Disposition', 'attachment; filename=' + `${this.appMappings.APP_NAME}.zip`);
            tZip.generateNodeStream({ type: "nodebuffer", streamFiles: true }).pipe(pRes);
        });
    }
}

module.exports = UI5AppGen;