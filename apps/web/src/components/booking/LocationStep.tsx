import { useEffect, useState } from 'react';
import {
  checkServiceability,
  getDistricts,
  type District,
} from '../../lib/catalogue';
import { geocode } from '../../lib/geocode';
import { LocationPicker, type MapView } from './LocationPicker';
import { inputClass, labelClass } from './styles';
import type { StepProps } from './types';

const DEFAULT_VIEW: MapView = { lat: 11.0168, lng: 76.9558, zoom: 7 };

export function LocationStep({ draft, update }: StepProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<MapView>(() =>
    draft.latitude !== null && draft.longitude !== null
      ? { lat: draft.latitude, lng: draft.longitude, zoom: 16 }
      : DEFAULT_VIEW,
  );
  const [finding, setFinding] = useState(false);
  const [mapMessage, setMapMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    getDistricts()
      .then(setDistricts)
      .catch((err: unknown) =>
        setLoadError(err instanceof Error ? err.message : 'Could not load districts'),
      );
  }, []);

  const { districtId, latitude, longitude } = draft;

  useEffect(() => {
    if (districtId === null || latitude === null || longitude === null) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    setCheckError(null);
    checkServiceability(districtId, latitude, longitude)
      .then((result) => {
        if (!cancelled) update({ serviceable: result.serviceable });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        update({ serviceable: null });
        setCheckError(
          err instanceof Error ? err.message : 'Could not check your location',
        );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtId, latitude, longitude, update]);

  async function handleDistrictChange(value: string) {
    const district = districts.find((d) => d.id === Number(value));
    setMapMessage(null);
    update({
      districtId: district?.id ?? null,
      districtName: district?.name ?? '',
      latitude: null,
      longitude: null,
      serviceable: null,
    });
    if (district) {
      const point = await geocode(`${district.name}, Tamil Nadu, India`);
      if (point) setView({ ...point, zoom: 11 });
    }
  }

  async function handleFind() {
    if (!draft.districtName) {
      setMapMessage('Choose a district first.');
      return;
    }
    setFinding(true);
    setMapMessage(null);
    const point = await geocode(
      `${draft.address}, ${draft.districtName}, Tamil Nadu, India`,
    );
    setFinding(false);
    if (!point) {
      setMapMessage(
        'Could not find that address. Click on the map to drop a pin instead.',
      );
      return;
    }
    setView({ ...point, zoom: 16 });
    update({
      latitude: Number(point.lat.toFixed(7)),
      longitude: Number(point.lng.toFixed(7)),
    });
  }

  function handlePick(lat: number, lng: number) {
    setMapMessage(null);
    update({
      latitude: Number(lat.toFixed(7)),
      longitude: Number(lng.toFixed(7)),
    });
  }

  let status: { text: string; className: string } | null = null;
  if (districtId === null) {
    status = { text: 'Choose a district to begin.', className: 'text-primary/70' };
  } else if (latitude === null) {
    status = {
      text: 'Find your address or click the map to drop a pin.',
      className: 'text-primary/70',
    };
  } else if (checking) {
    status = { text: 'Checking your location…', className: 'text-primary/70' };
  } else if (checkError) {
    status = { text: checkError, className: 'text-danger' };
  } else if (draft.serviceable === true) {
    status = {
      text: '✓ Your location is serviceable. Address and pin confirmed.',
      className: 'text-success',
    };
  } else if (draft.serviceable === false) {
    status = {
      text: 'We do not serve this district yet.',
      className: 'text-danger',
    };
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">Select your location</h2>
        <p className="mt-1 text-sm text-primary/70">
          Choose your district and confirm the exact spot on the map.
        </p>
      </div>

      {loadError && <p className="text-sm text-danger">{loadError}</p>}

      <label className={labelClass}>
        District
        <select
          className={inputClass}
          value={draft.districtId ?? ''}
          onChange={(e) => void handleDistrictChange(e.target.value)}
        >
          <option value="">Select a district</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Service address
        <input
          className={inputClass}
          value={draft.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="House or building, street, area"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleFind()}
          disabled={finding || draft.address.trim().length < 3}
          className="rounded-full border border-primary/20 px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
        >
          {finding ? 'Searching…' : 'Find on map'}
        </button>
        {mapMessage && <p className="text-sm text-danger">{mapMessage}</p>}
      </div>

      <LocationPicker
        view={view}
        marker={
          latitude !== null && longitude !== null
            ? { lat: latitude, lng: longitude }
            : null
        }
        onPick={handlePick}
      />

      {latitude !== null && longitude !== null && (
        <p className="text-xs text-primary/60">
          Pin: {latitude}, {longitude}
        </p>
      )}

      {status && <p className={`text-sm ${status.className}`}>{status.text}</p>}
    </div>
  );
}