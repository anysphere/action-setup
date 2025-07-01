import { getBooleanInput, getInput } from '@actions/core'
import expandTilde from 'expand-tilde'
import { RunInstall, parseRunInstall } from './run-install'

export interface Inputs {
  readonly version?: string
  readonly dest: string
  readonly runInstall: RunInstall[]
  readonly packageJsonFile: string
  readonly standalone: boolean
}

const parseInputPath = (name: string, required = true) => expandTilde(getInput(name, { required }))

export const getInputs = (): Inputs => ({
  version: getInput('version'),
  dest: parseInputPath('dest'),
  runInstall: parseRunInstall('run_install'),
  packageJsonFile: parseInputPath('package_json_file', false) || 'package.json',
  standalone: getBooleanInput('standalone'),
})

export default getInputs
