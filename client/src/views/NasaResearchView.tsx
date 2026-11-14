import React, { useCallback, useEffect, useState } from 'react';
import { Search, Database, ExternalLink, ChevronLeft, ChevronRight, Microscope, CalendarDays, FlaskConical, RefreshCw, X } from 'lucide-react';
import { request } from '../api';

interface Dataset {
  id: string;
  title: string;
  description?: string;
  organism?: string;
  materialType?: string;
  assayType?: string;
  technology?: string;
  project?: string;
  flightProgram?: string;
  mission?: string;
  missionStart?: string;
  missionEnd?: string;
  releaseDate?: number | string;
  publication?: string;
  sourceUrl: string;
}

interface DatasetResponse {
  dataType: string;
  simulated: boolean;
  source: string;
  fetchedAt: string;
  total: number;
  from: number;
  size: number;
  datasets: Dataset[];
}

export const NasaResearchView: React.FC = () => {
  const [query, setQuery] = useState('space');
  const [searchTerm, setSearchTerm] = useState('space');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<DatasetResponse | null>(null);
  const [selected, setSelected] = useState<Dataset | null>(null);
  const [detail, setDetail] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const pageSize = 10;

  const loadDatasets = useCallback(async (term: string, currentPage: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await request<DatasetResponse>('/api/nasa/osdr/datasets', {
        params: { q: term, from: currentPage * pageSize, size: pageSize }
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load NASA research datasets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(query.trim() || 'space');
      setPage(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    loadDatasets(searchTerm, page);
  }, [searchTerm, page, loadDatasets]);

  const openDataset = async (dataset: Dataset) => {
    setSelected(dataset);
    setDetail(null);
    setDetailLoading(true);
    try {
      const response = await request<any>(`/api/nasa/osdr/datasets/${encodeURIComponent(dataset.id)}`);
      setDetail(response.dataset || response);
    } catch {
      setDetail(dataset);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / pageSize)) : 1;

  const releaseDate = (value?: number | string) => {
    if (!value) return '--';
    const date = typeof value === 'number'
      ? new Date(value < 1000000000000 ? value * 1000 : value)
      : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  };

  return (
    <section className="space-intel-page">
      <div className="space-intel-heading">
        <div>
          <div className="space-intel-eyebrow"><Database size={14} /> SCIENTIFIC DISCOVERY</div>
          <h1>NASA Research Explorer</h1>
          <p>Explore published space biology and life-sciences research from NASA's Open Science Data Repository.</p>
        </div>
        <span className="space-source-badge nasa"><Database size={12} /> NASA RESEARCH</span>
      </div>

      <div className="nasa-research-intro">
        <div className="nasa-research-intro-icon"><Microscope size={25} /></div>
        <div>
          <strong>Open science. Real mission research.</strong>
          <p>Discover research studies, organisms, experimental methods and mission context from publicly released NASA datasets.</p>
        </div>
      </div>

      <div className="nasa-search-bar">
        <Search size={18} />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              setSearchTerm(query.trim() || 'space');
              setPage(0);
            }
          }}
          placeholder="Search datasets, organisms, missions..."
          aria-label="Search NASA datasets"
        />
        {query && <button onClick={() => setQuery('space')} aria-label="Clear search"><X size={16} /></button>}
      </div>

      <div className="nasa-results-toolbar">
        <div>
          <span className="space-intel-eyebrow">REPOSITORY RESULTS</span>
          <p>{result ? `${result.total.toLocaleString()} published studies found` : 'Searching NASA repository...'}</p>
        </div>
        <button className="space-intel-refresh" onClick={() => loadDatasets(searchTerm, page)} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'space-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="space-intel-error">{error}</div>}

      {loading ? (
        <div className="nasa-loading"><RefreshCw size={20} className="space-spin" /> Loading NASA research datasets...</div>
      ) : result?.datasets?.length ? (
        <>
          <div className="nasa-dataset-grid">
            {result.datasets.map(dataset => (
              <article className="nasa-dataset-card" key={dataset.id}>
                <div className="nasa-dataset-card-top">
                  <span className="nasa-dataset-id">{dataset.id}</span>
                  <span className="space-source-badge nasa">NASA</span>
                </div>
                <h3>{dataset.title}</h3>
                <p className="nasa-dataset-description">{dataset.description || 'No study description is available in the repository listing.'}</p>
                <div className="nasa-dataset-tags">
                  {dataset.organism && <span>{dataset.organism}</span>}
                  {dataset.materialType && <span>{dataset.materialType}</span>}
                  {dataset.mission && <span>{dataset.mission}</span>}
                </div>
                <div className="nasa-dataset-footer">
                  <span><CalendarDays size={13} /> {releaseDate(dataset.releaseDate)}</span>
                  <button onClick={() => openDataset(dataset)}>Explore study <ExternalLink size={13} /></button>
                </div>
              </article>
            ))}
          </div>

          <div className="nasa-pagination">
            <span>Page {page + 1} of {totalPages}</span>
            <div>
              <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))}>
                <ChevronLeft size={16} /> Previous
              </button>
              <button disabled={page + 1 >= totalPages || loading} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="nasa-empty-state">
          <Database size={30} />
          <h3>No matching studies found</h3>
          <p>Try another keyword, organism or mission name.</p>
        </div>
      )}

      {selected && (
        <div className="nasa-modal-backdrop" onClick={() => setSelected(null)}>
          <section className="nasa-detail-modal" onClick={event => event.stopPropagation()}>
            <div className="nasa-modal-header">
              <div>
                <span className="nasa-dataset-id">{selected.id}</span>
                <h2>Study details</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close details"><X size={19} /></button>
            </div>
            {detailLoading ? (
              <div className="nasa-loading"><RefreshCw size={18} className="space-spin" /> Retrieving study details...</div>
            ) : (
              <>
                <h3 className="nasa-modal-title">{detail?.title || selected.title}</h3>
                <p className="nasa-modal-description">{detail?.description || selected.description || 'No description available.'}</p>
                <div className="nasa-detail-grid">
                  {[
                    ['Organism', detail?.organism || selected.organism],
                    ['Material type', detail?.materialType || selected.materialType],
                    ['Assay type', detail?.assayType || selected.assayType],
                    ['Technology', detail?.technology || selected.technology],
                    ['Project', detail?.project || selected.project],
                    ['Flight program', detail?.flightProgram || selected.flightProgram],
                    ['Mission', detail?.mission || selected.mission],
                    ['Mission start', detail?.missionStart || selected.missionStart],
                    ['Mission end', detail?.missionEnd || selected.missionEnd],
                    ['Release date', releaseDate(detail?.releaseDate || selected.releaseDate)],
                  ].map(([label, value]) => (
                    <div className="nasa-detail-field" key={label}>
                      <span>{label}</span>
                      <strong>{value || '--'}</strong>
                    </div>
                  ))}
                </div>
                {(detail?.publication || selected.publication) && (
                  <div className="nasa-publication">
                    <strong>Publication</strong>
                    <p>{detail?.publication || selected.publication}</p>
                  </div>
                )}
                <a className="nasa-source-link" href={detail?.sourceUrl || selected.sourceUrl} target="_blank" rel="noreferrer">
                  View original NASA study <ExternalLink size={14} />
                </a>
              </>
            )}
          </section>
        </div>
      )}

      <div className="space-intel-source-note">
        <FlaskConical size={15} />
        NASA OSDR contains published biological and life-sciences research. These studies are not live astronaut health measurements.
        {result?.fetchedAt && <span> Repository response: {new Date(result.fetchedAt).toLocaleString()}</span>}
      </div>
    </section>
  );
};
