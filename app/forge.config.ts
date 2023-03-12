import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { WebpackPlugin } from '@electron-forge/plugin-webpack'
import { mainConfig } from './webpack.main.config'
import { rendererConfig } from './webpack.renderer.config'

const config = {
	packagerConfig: {},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel(),
		new MakerZIP(),
		new MakerRpm(),
		new MakerDeb()
	],
	plugins: [
		new WebpackPlugin({
			mainConfig,
			renderer: {
				config: rendererConfig,
				entryPoints: [
					{
						html: './src/index.html',
						js: './src/index.tsx',
						name: 'main_window'
					}
				]
			}
		})
	]
}

export default config