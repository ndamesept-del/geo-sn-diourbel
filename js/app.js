(function () {
  "use strict";

  // Configuration initiale demandée dans le sujet d'examen.
  const centerLat = 14.768905;
  const centerLon = -16.216307;
  const initialZoom = 10;

  const sources = {
    department: "data/departement.geojson",
    districts: "data/arrondissements.geojson",
    roads: "data/routes.geojson",
    localities: "data/localites.geojson",
    schools: "data/ecoles.geojson"
  };

  function loadGeoJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Impossible de charger " + url + " (HTTP " + response.status + ")");
      return response.json();
    }).then(function (geojson) {
      if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        throw new Error("Le fichier " + url + " n'est pas un GeoJSON FeatureCollection valide.");
      }
      return geojson;
    });
  }

  Promise.all(Object.keys(sources).map(function (key) {
    return loadGeoJson(sources[key]).then(function (geojson) { return [key, geojson]; });
  })).then(function (entries) {
    const data = {};
    entries.forEach(function (entry) { data[entry[0]] = entry[1]; });
    initialiseMap(data);
  }).catch(function (error) {
    const overlay = document.getElementById("loading-overlay");
    overlay.classList.add("error");
    overlay.innerHTML = "<strong>Les données cartographiques n'ont pas pu être chargées.</strong><span>Ouvrez le projet avec un serveur local ou depuis GitHub Pages.</span>";
    document.getElementById("load-status").lastChild.textContent = " Erreur de chargement";
    console.error(error);
  });

  function initialiseMap(data) {
  document.getElementById("loading-overlay").hidden = true;
  document.getElementById("load-status").lastChild.textContent = " Données chargées";

  const map = L.map("map", {
    center: [centerLat, centerLon],
    zoom: initialZoom,
    zoomControl: false,
    preferCanvas: true
  });

  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({ position: "bottomright", imperial: false }).addTo(map);

  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© contributeurs OpenStreetMap"
  }).addTo(map);

  const humanitarian = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© contributeurs OpenStreetMap · tuiles HOT"
  });

  L.control.layers({ "Plan OpenStreetMap": osm, "Plan humanitaire": humanitarian }, null, {
    position: "topright",
    collapsed: true
  }).addTo(map);

  map.createPane("departmentPane");
  map.getPane("departmentPane").style.zIndex = 310;
  map.createPane("districtPane");
  map.getPane("districtPane").style.zIndex = 320;
  map.createPane("roadPane");
  map.getPane("roadPane").style.zIndex = 340;
  map.createPane("localityPane");
  map.getPane("localityPane").style.zIndex = 360;
  map.createPane("schoolPane");
  map.getPane("schoolPane").style.zIndex = 380;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function popup(kicker, title, rows) {
    const lines = rows
      .filter(function (row) { return row[1] !== null && row[1] !== undefined && row[1] !== ""; })
      .map(function (row) {
        return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
      }).join("");
    return "<div class='popup-kicker'>" + escapeHtml(kicker) + "</div>" +
      "<h4 class='popup-title'>" + escapeHtml(title) + "</h4>" +
      "<dl class='popup-table'>" + lines + "</dl>";
  }

  const departmentLayer = L.geoJSON(data.department, {
    pane: "departmentPane",
    style: { color: "#3155c6", weight: 3, opacity: 1, fillColor: "#3155c6", fillOpacity: 0.09 },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(popup("Département", feature.properties.Dept || "Diourbel", [
        ["Région", feature.properties["R�gion"] || "Diourbel"],
        ["Code", feature.properties.Cod_Dept]
      ]));
    }
  });

  const districtLayer = L.geoJSON(data.districts, {
    pane: "districtPane",
    style: { color: "#e0a13d", weight: 2, dashArray: "7 5", fillColor: "#f5c542", fillOpacity: 0.08 },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(popup("Arrondissement", feature.properties.arr || "Sans nom", [
        ["Département", feature.properties.dept],
        ["Code", feature.properties.code_arr]
      ]));
      if (feature.properties.arr) {
        layer.bindTooltip(escapeHtml(feature.properties.arr), { sticky: true, direction: "center", className: "district-label" });
      }
    }
  });

  function roadStyle(feature) {
    const type = String((feature.properties && feature.properties.FONCTION) || "").toLowerCase();
    if (type.indexOf("principale") >= 0) return { color: "#c95e3b", weight: type.indexOf("4 voies") >= 0 ? 5 : 3.4, opacity: 0.92 };
    if (type.indexOf("piste") >= 0) return { color: "#d99737", weight: 1.8, opacity: 0.82, dashArray: "6 5" };
    if (type.indexOf("fer") >= 0) return { color: "#434b62", weight: 2, opacity: 0.85, dashArray: "2 5" };
    return { color: "#9d6c4c", weight: 1.7, opacity: 0.75 };
  }

  const roadLayer = L.geoJSON(data.roads, {
    pane: "roadPane",
    style: roadStyle,
    onEachFeature: function (feature, layer) {
      layer.bindPopup(popup("Réseau routier", feature.properties.FONCTION || "Route", [
        ["Code", feature.properties.CODE],
        ["Longueur", feature.properties.LONGUEUR ? Math.round(feature.properties.LONGUEUR).toLocaleString("fr-FR") + " m" : null]
      ]));
    }
  });

  const localityLayer = L.geoJSON(data.localities, {
    pane: "localityPane",
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 3.8,
        color: "#ffffff",
        weight: 1,
        fillColor: "#5b44c7",
        fillOpacity: 0.9
      });
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(popup("Localité", feature.properties.NOM || "Sans nom", [
        ["Élévation", feature.properties.ELEVATION ? feature.properties.ELEVATION + " m" : null],
        ["Identifiant", feature.properties.NUM_VILLAG]
      ]));
      if (feature.properties.NOM) layer.bindTooltip(escapeHtml(feature.properties.NOM), { sticky: true });
    }
  });

  const schoolIcon = L.divIcon({
    className: "",
    html: "<div class='school-marker'><span>✦</span></div>",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });

  const schoolLayer = L.geoJSON(data.schools, {
    pane: "schoolPane",
    pointToLayer: function (feature, latlng) { return L.marker(latlng, { icon: schoolIcon }); },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(popup("Établissement scolaire", feature.properties.name || "École sans nom", [
        ["Classe OSM", feature.properties.fclass],
        ["Gestionnaire", feature.properties.operator],
        ["Source", feature.properties.source]
      ]));
      layer.bindTooltip(escapeHtml(feature.properties.name || "École"), { direction: "top", offset: [0, -8] });
    }
  });

  const layers = {
    department: departmentLayer,
    districts: districtLayer,
    roads: roadLayer,
    localities: localityLayer,
    schools: schoolLayer
  };

  Object.keys(layers).forEach(function (key) { layers[key].addTo(map); });

  const departmentBounds = departmentLayer.getBounds();

  const countMap = {
    schools: ["school-count", "school-layer-count"],
    localities: ["locality-count", "locality-layer-count"],
    districts: ["district-count", "district-layer-count"],
    roads: ["road-layer-count"]
  };

  Object.keys(countMap).forEach(function (key) {
    const value = data[key].features.length.toLocaleString("fr-FR");
    countMap[key].forEach(function (id) {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    });
  });

  document.querySelectorAll("[data-layer]").forEach(function (input) {
    input.addEventListener("change", function () {
      const layer = layers[input.dataset.layer];
      if (input.checked) layer.addTo(map); else map.removeLayer(layer);
    });
  });

  const toggleAll = document.getElementById("toggle-all");
  toggleAll.addEventListener("click", function () {
    const inputs = Array.from(document.querySelectorAll("[data-layer]"));
    const anyChecked = inputs.some(function (input) { return input.checked; });
    inputs.forEach(function (input) {
      input.checked = !anyChecked;
      input.dispatchEvent(new Event("change"));
    });
    toggleAll.textContent = anyChecked ? "Tout afficher" : "Tout masquer";
  });

  document.getElementById("fit-button").addEventListener("click", function () {
    map.fitBounds(departmentBounds, { padding: [20, 20] });
  });

  document.getElementById("nav-home").addEventListener("click", function () {
    map.setView([centerLat, centerLon], initialZoom);
  });

  const searchItems = [];
  function indexLayer(layer, type, property) {
    layer.eachLayer(function (featureLayer) {
      const name = featureLayer.feature && featureLayer.feature.properties[property];
      if (name) searchItems.push({ name: String(name), type: type, layer: featureLayer, group: layer });
    });
  }
  indexLayer(schoolLayer, "École", "name");
  indexLayer(localityLayer, "Localité", "NOM");
  indexLayer(districtLayer, "Arrondissement", "arr");

  const searchInput = document.getElementById("feature-search");
  const searchResults = document.getElementById("search-results");
  function normalize(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function renderSearch() {
    const query = normalize(searchInput.value.trim());
    searchResults.innerHTML = "";
    if (query.length < 2) { searchResults.hidden = true; return; }
    const matches = searchItems.filter(function (item) { return normalize(item.name).indexOf(query) >= 0; }).slice(0, 8);
    searchResults.hidden = false;
    if (!matches.length) {
      searchResults.innerHTML = "<div class='no-results'>Aucun résultat dans les couches chargées.</div>";
      return;
    }
    matches.forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result";
      button.innerHTML = "<strong>" + escapeHtml(item.name) + "</strong><small>" + escapeHtml(item.type) + "</small>";
      button.addEventListener("click", function () {
        if (!map.hasLayer(item.group)) item.group.addTo(map);
        if (item.layer.getLatLng) map.setView(item.layer.getLatLng(), 14);
        else if (item.layer.getBounds) map.fitBounds(item.layer.getBounds(), { maxZoom: 13, padding: [30, 30] });
        item.layer.openPopup();
        searchResults.hidden = true;
      });
      searchResults.appendChild(button);
    });
  }
  searchInput.addEventListener("input", renderSearch);
  document.getElementById("clear-search").addEventListener("click", function () {
    searchInput.value = "";
    renderSearch();
    searchInput.focus();
  });

  map.on("mousemove", function (event) {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;
    const latText = Math.abs(lat).toFixed(5) + "° " + (lat >= 0 ? "N" : "S");
    const lngText = Math.abs(lng).toFixed(5) + "° " + (lng >= 0 ? "E" : "O");
    document.getElementById("coordinates").textContent = latText + " · " + lngText;
  });

  document.querySelector("#map-note button").addEventListener("click", function () {
    document.getElementById("map-note").hidden = true;
  });

  const aboutDialog = document.getElementById("about-dialog");
  const catalogDialog = document.getElementById("catalog-dialog");
  const geocodeDialog = document.getElementById("geocode-dialog");
  const downloadDialog = document.getElementById("download-dialog");
  document.getElementById("nav-about").addEventListener("click", function () { aboutDialog.showModal(); });
  document.getElementById("nav-catalog").addEventListener("click", function () { catalogDialog.showModal(); });
  document.getElementById("nav-geocode").addEventListener("click", function () {
    geocodeDialog.showModal();
    setTimeout(function () { document.getElementById("geocode-input").focus(); }, 50);
  });
  document.getElementById("nav-download").addEventListener("click", function () { downloadDialog.showModal(); });
  document.getElementById("catalog-close").addEventListener("click", function () { catalogDialog.close(); });
  document.getElementById("geocode-close").addEventListener("click", function () { geocodeDialog.close(); });
  document.getElementById("download-close").addEventListener("click", function () { downloadDialog.close(); });

  let geocodeMarker = null;
  const geocodeForm = document.getElementById("geocode-form");
  const geocodeInput = document.getElementById("geocode-input");
  const geocodeResults = document.getElementById("geocode-results");
  geocodeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const query = geocodeInput.value.trim();
    if (query.length < 3) return;
    geocodeResults.innerHTML = "<div class='geocode-message'>Recherche en cours…</div>";
    const endpoint = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=sn&q=" + encodeURIComponent(query);
    fetch(endpoint, { headers: { "Accept-Language": "fr" } })
      .then(function (response) {
        if (!response.ok) throw new Error("Service de géocodage indisponible");
        return response.json();
      })
      .then(function (results) {
        geocodeResults.innerHTML = "";
        if (!results.length) {
          geocodeResults.innerHTML = "<div class='geocode-message'>Aucun résultat trouvé au Sénégal.</div>";
          return;
        }
        results.forEach(function (result) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "geocode-result";
          button.innerHTML = "<strong>" + escapeHtml(result.display_name) + "</strong><small>Latitude " + escapeHtml(result.lat) + " · Longitude " + escapeHtml(result.lon) + "</small>";
          button.addEventListener("click", function () {
            const latlng = [Number(result.lat), Number(result.lon)];
            if (geocodeMarker) map.removeLayer(geocodeMarker);
            geocodeMarker = L.marker(latlng).addTo(map).bindPopup(popup("Résultat du géocodage", result.display_name, [
              ["Latitude", Number(result.lat).toFixed(6)],
              ["Longitude", Number(result.lon).toFixed(6)]
            ])).openPopup();
            map.setView(latlng, 14);
            geocodeDialog.close();
          });
          geocodeResults.appendChild(button);
        });
      })
      .catch(function () {
        geocodeResults.innerHTML = "<div class='geocode-message'>Le service de géocodage ne répond pas. Vérifiez la connexion Internet puis réessayez.</div>";
      });
  });

  const sidebar = document.getElementById("sidebar");
  const panelToggle = document.getElementById("panel-toggle");
  panelToggle.addEventListener("click", function () {
    const isOpen = sidebar.classList.toggle("open");
    panelToggle.setAttribute("aria-expanded", String(isOpen));
    setTimeout(function () { map.invalidateSize(); }, 250);
  });
  map.on("click", function () {
    if (window.innerWidth <= 780) {
      sidebar.classList.remove("open");
      panelToggle.setAttribute("aria-expanded", "false");
    }
  });

  window.addEventListener("resize", function () { map.invalidateSize(); });
  }
}());
