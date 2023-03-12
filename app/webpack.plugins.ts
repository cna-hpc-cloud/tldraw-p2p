import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'

// eslint-disable-next-line @typescript-eslint/no-var-requires, unicorn/prefer-module
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

export const plugins = [new ForkTsCheckerWebpackPlugin()]
