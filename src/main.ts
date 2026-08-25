import { StartUpPageCreateResult, waitForEvenAppBridge } from '@evenrealities/even_hub_sdk'
import './style.css'
import { createInitialNavigationState } from './navigation/navigationState'
import { renderHomeDomPreview, renderHomeScreen } from './screens/home'

type EvenHostWindow = Window & {
  flutter_inappwebview?: {
    callHandler?: (...args: unknown[]) => Promise<unknown>
  }
}

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('LeetLens requires an #app root element.')
}

function hasEvenHubHostBridge(): boolean {
  const hostWindow = window as EvenHostWindow

  return typeof hostWindow.flutter_inappwebview?.callHandler === 'function'
}

async function startLeetLens(): Promise<void> {
  const navigationState = createInitialNavigationState()

  renderHomeDomPreview(root, navigationState)

  if (!hasEvenHubHostBridge()) {
    console.info('Even Hub host bridge not found; showing browser preview only.')
    return
  }

  const bridge = await waitForEvenAppBridge()
  const result = await renderHomeScreen(bridge, navigationState)

  if (result !== StartUpPageCreateResult.success) {
    console.error(`Failed to create LeetLens startup page: ${StartUpPageCreateResult[result]}`)
  }
}

void startLeetLens().catch((error: unknown) => {
  console.error('LeetLens startup failed', error)
})
