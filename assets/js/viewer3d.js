import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

export class NameplateViewer3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf4f6f8);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 260;
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    this.camera.position.set(0, 0, 120);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dir1.position.set(1, 1, 2);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-1, -0.5, 1);
    this.scene.add(ambient, dir1, dir2);

    this.mesh = null;
    this._animating = false;
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;
    this._cameraDistance = 120;

    this._onResize = () => this.resize();
    this._onPointerDown = (e) => this.onPointerDown(e);
    this._onPointerMove = (e) => this.onPointerMove(e);
    this._onPointerUp = () => this.onPointerUp();
    this._onWheel = (e) => this.onWheel(e);

    const el = this.renderer.domElement;
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", this._onPointerDown);
    el.addEventListener("pointermove", this._onPointerMove);
    el.addEventListener("pointerup", this._onPointerUp);
    el.addEventListener("pointerleave", this._onPointerUp);
    el.addEventListener("wheel", this._onWheel, { passive: false });
    window.addEventListener("resize", this._onResize);
  }

  onPointerDown(e) {
    if (!this.mesh) return;
    this._dragging = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this.renderer.domElement.setPointerCapture(e.pointerId);
  }

  onPointerMove(e) {
    if (!this._dragging || !this.mesh) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;

    // 直接轉動模型，鬆手後保持角度，不會彈回
    this.mesh.rotateY(dx * 0.012);
    this.mesh.rotateX(dy * 0.012);
  }

  onPointerUp() {
    this._dragging = false;
  }

  onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    this._cameraDistance = THREE.MathUtils.clamp(
      this._cameraDistance * factor,
      30,
      400
    );
    this.camera.position.z = this._cameraDistance;
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
    this.mesh.rotation.set(0, 0, 0);
    this.scene.add(this.mesh);

    geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    this._cameraDistance = maxDim * 2.2;
    this.camera.position.set(0, 0, this._cameraDistance);
    this.camera.lookAt(0, 0, 0);
    this.resize();
  }

  start() {
    if (this._animating) return;
    this._animating = true;
    const tick = () => {
      if (!this._animating) return;
      requestAnimationFrame(tick);
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
    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this._onPointerDown);
    el.removeEventListener("pointermove", this._onPointerMove);
    el.removeEventListener("pointerup", this._onPointerUp);
    el.removeEventListener("pointerleave", this._onPointerUp);
    el.removeEventListener("wheel", this._onWheel);
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    this.renderer.dispose();
    this.container.innerHTML = "";
  }
}
