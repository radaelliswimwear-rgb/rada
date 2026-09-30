/**
 * "Mis favoritos" — extensión full-page de la cuenta de clienta
 * (target customer-account.page.render; diseño E5 y R2).
 *
 * Esta capa SOLO dibuja: toda la lógica (parseo, modelo de vista, estado,
 * errores) está en model.js / api.js y se prueba en Node. Este archivo
 * necesita el runtime de Shopify (Preact + componentes web Polaris) y no se
 * puede ejecutar ni tipar sin `npm install` (ver README).
 */
import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useCallback, useEffect, useMemo, useReducer } from 'preact/hooks';
import {
  BACKEND_URL,
  BACKEND_TIMEOUT_MS,
  CUSTOMER_ACCOUNT_API_VERSION,
  STOREFRONT_API_VERSION,
} from './config.js';
import { createFavoritesApi } from './api.js';
import { initialState, presentFavorite, reducer, toErrorInfo } from './model.js';

export default async () => {
  render(<MisFavoritosPage />, document.body);
};

function MisFavoritosPage() {
  const t = (key, params) => shopify.i18n.translate(key, params);
  const formatCurrency = (amount, options) => shopify.i18n.formatCurrency(amount, options);
  const api = useMemo(
    () =>
      createFavoritesApi({
        fetchImpl: (url, init) => fetch(url, init),
        storefrontQuery: (query, options) => shopify.query(query, options),
        getSessionToken: () => shopify.sessionToken.get(),
        backendUrl: BACKEND_URL,
        customerAccountApiVersion: CUSTOMER_ACCOUNT_API_VERSION,
        storefrontApiVersion: STOREFRONT_API_VERSION,
        timeoutMs: BACKEND_TIMEOUT_MS,
      }),
    [],
  );
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    dispatch({ type: 'load_started' });
    try {
      const { items, storeUrl } = await api.loadFavorites();
      dispatch({ type: 'load_succeeded', items, storeUrl });
    } catch (error) {
      dispatch({ type: 'load_failed', error: toErrorInfo(error) });
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // La cuenta cambió desde otro dispositivo mientras se quitaba algo: se recarga.
  useEffect(() => {
    if (state.stale) load();
  }, [state.stale, load]);

  async function remove(item) {
    dispatch({ type: 'remove_started', id: item.id });
    try {
      const ids = await api.removeFavorite(item.id);
      dispatch({ type: 'remove_succeeded', id: item.id, ids });
      shopify.toast.show(t('removed'));
    } catch (error) {
      dispatch({ type: 'remove_failed', id: item.id, error: toErrorInfo(error) });
    }
  }

  const count = state.items.length;
  const subheading = state.status === 'ready' && count > 0 ? t('count', { count }) : undefined;

  return (
    <s-page heading={t('title')} subheading={subheading}>
      {/* El aviso se limpia solo con la próxima acción o recarga exitosa. */}
      {state.notice ? <s-banner tone="critical">{t(state.notice.key)}</s-banner> : null}

      {state.status === 'loading' && count === 0 ? (
        <s-stack direction="inline" gap="base" alignItems="center" accessibilityRole="status">
          <s-spinner accessibilityLabel={t('loading')} />
          <s-text>{t('loading')}</s-text>
        </s-stack>
      ) : null}

      {state.status === 'ready' && count === 0 ? (
        <s-section>
          <s-stack direction="block" gap="base">
            <s-heading>{t('empty_title')}</s-heading>
            <s-text color="subdued">{t('empty_text')}</s-text>
            {state.storeUrl ? <s-button href={`${state.storeUrl}/#categorias`}>{t('explore')}</s-button> : null}
          </s-stack>
        </s-section>
      ) : null}

      {count > 0 ? (
        <s-stack direction="block" gap="base" accessibilityRole="unordered-list" accessibilityLabel={t('title')}>
          {state.items.map((item) => (
            <FavoriteRow
              key={item.id}
              view={presentFavorite(item, { t, formatCurrency })}
              removing={state.removing.includes(item.id)}
              onRemove={() => remove(item)}
            />
          ))}
        </s-stack>
      ) : null}
    </s-page>
  );
}

function FavoriteRow({ view, removing, onRemove }) {
  return (
    <s-stack accessibilityRole="list-item" direction="inline" gap="base" alignItems="center" justifyContent="space-between">
      <s-stack direction="inline" gap="base" alignItems="center">
        {view.image ? <s-product-thumbnail src={view.image.src} alt={view.image.alt} /> : null}
        <s-stack direction="block" gap="small">
          {view.href ? <s-link href={view.href}>{view.title}</s-link> : <s-text>{view.title || view.message}</s-text>}
          {view.priceText ? <s-text>{view.priceText}</s-text> : null}
          {view.badgeText ? <s-badge color="subdued">{view.badgeText}</s-badge> : null}
          {view.message && view.title ? <s-text color="subdued">{view.message}</s-text> : null}
        </s-stack>
      </s-stack>
      <s-stack direction="inline" gap="small" alignItems="center">
        {view.href ? (
          <s-button variant="secondary" href={view.href} accessibilityLabel={`${view.viewLabel}: ${view.title}`}>
            {view.viewLabel}
          </s-button>
        ) : null}
        <s-button
          variant="secondary"
          tone="critical"
          loading={removing}
          disabled={removing}
          accessibilityLabel={view.removeLabel}
          onClick={onRemove}
        >
          {view.removeText}
        </s-button>
      </s-stack>
    </s-stack>
  );
}
