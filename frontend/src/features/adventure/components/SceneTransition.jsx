export default function SceneTransition({ chapter }) {
  return chapter ? (
    <div className="scene-transition" role="status">
      <strong>{chapter.de}</strong>
      <p>{chapter.location}</p>
      <div className="transition-track">
        <i />
      </div>
    </div>
  ) : null;
}
