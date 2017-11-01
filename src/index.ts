import * as spauth from 'node-sp-auth';
import { AuthConfig } from 'node-sp-auth-config';
import * as https from 'https';
import * as http from 'http';
import { Config } from "http-proxy-middleware";
import { NextFunction, Request, Response, Application } from "express";
import * as fs from 'fs';
import * as path from 'path';
import { Configuration } from "webpack";
import * as url from 'url';

let keepaliveAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false
});

const authKey = '_sp_auth_';
const strategyKey = '_sp_auth_strategy_';

export function bootstrap(webpackConfig: Configuration, filePath: string): Configuration {
    webpackConfig.devServer = webpackConfig.devServer || {};

    if (webpackConfig.devServer.before && typeof webpackConfig.devServer.before === 'function') {
        let oldBefore = webpackConfig.devServer.before;
        webpackConfig.devServer.before = (app: Application) => {
            oldBefore(app);
            app.use('/_api', onBeforeLoad(filePath));
        }
    } else {
        webpackConfig.devServer.before = (app: Application) => {
            app.use('/_api', onBeforeLoad(filePath));
        }
    }

    webpackConfig.devServer.proxy = webpackConfig.devServer.proxy || {};
    let proxyConfig = getProxyConfig(filePath);
    webpackConfig.devServer.proxy = {
        ...webpackConfig.devServer.proxy,
        ...proxyConfig
    }

    return webpackConfig;
}

export function onBeforeLoad(filePath: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authConfig = new AuthConfig({
            configPath: filePath,
            encryptPassword: true,
            saveConfigOnDisk: true
        });

        authConfig.getContext()
            .then(context => {
                return Promise.all([spauth.getAuth(context.siteUrl, context.authOptions), context.strategy]);
            })
            .then(data => {
                res.locals[authKey] = data[0];
                res.locals[strategyKey] = data[1];
                next();
            });
    }
}

export function getProxyConfig(filePath: string): { [url: string]: Config } {
    let config = JSON.parse(fs.readFileSync(path.resolve(filePath)).toString());

    let proxyConfig: Config = {
        secure: false,
        changeOrigin: true,
        target: config.siteUrl,
        onProxyReq: onProxyReq(config.siteUrl)
    };
    let isHttps = url.parse(config.siteUrl).protocol === 'https:';
    
    if (isHttps) {
        proxyConfig.agent = keepaliveAgent;
    }
    return {
        "/_api": {
            ...proxyConfig
        }
    }
}

function onProxyReq(siteUrl: string) {
    return (proxyReq: http.ClientRequest, req: Request, res: Response) => {
        let authData = res.locals[authKey];
        let strategy = res.locals[strategyKey];
        if (strategy === 'OnpremiseUserCredentials') {
            proxyReq.setHeader('www-authenticate', authData.headers.Authorization);
        } else {
            for (var key in authData.headers) {
                if (authData.headers.hasOwnProperty(key)) {
                    let headerValue = authData.headers[key];
                    proxyReq.setHeader(key, headerValue);
                }
            }
        }

        proxyReq.setHeader('Origin', siteUrl);
    }
}
