import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

export class NameplateViewer3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf4f6f8);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 260;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    this.camera.position.set(0, -80, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dir1.position.set(1, 1, 2);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-1, -0.5, 1);
    this.scene.add(ambient, dir1, dir2);

    this.mesh = null;
    this._animating = false;
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
  }

  resize() {
    const w = this.container.clientWidth || 400;
    const h = this.container.clientHeight || 260;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  async load(stlUrl, colorHex) {
    const loader = new STLLoader();
    const geometry = await loader.loadAsync(stlUrl);
    geometry.computeVertexNormals();
    geometry.center();

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      metalness: 0.15,
      roughness: 0.55,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2.2;
    this.camera.position.set(0, -dist * 0.85, dist * 0.55);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.resize();
  }

  start() {
    if (this._animating) return;
    this._animating = true;
    const tick = () => {
      if (!this._animating) return;
      requestAnimationFrame(tick);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  stop() {
    this._animating = false;
  }

  dispose() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    this.renderer.dispose();
    this.container.innerHTML = "";
  }
}
