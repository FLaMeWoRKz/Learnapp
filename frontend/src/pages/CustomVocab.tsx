import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customVocabAPI } from '../services/api';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { speakGerman, speakEnglish } from '../utils/speech';

interface Pack {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
}

interface Vocab {
  vocabId: string;
  german: string;
  english: string;
}

export default function CustomVocab() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [vocabularies, setVocabularies] = useState<Vocab[]>([]);
  const [newPackName, setNewPackName] = useState('');
  const [newGerman, setNewGerman] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [editingPackName, setEditingPackName] = useState('');

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (selectedPack) {
      loadVocabularies(selectedPack.id);
    } else {
      setVocabularies([]);
    }
  }, [selectedPack]);

  const loadPacks = async () => {
    try {
      const { packs } = await customVocabAPI.getPacks();
      setPacks(packs || []);
    } catch (error) {
      console.error('Fehler beim Laden der Packs:', error);
    }
  };

  const loadVocabularies = async (packId: string) => {
    try {
      const { vocabularies: vocabs } = await customVocabAPI.getVocabularies(packId);
      setVocabularies(vocabs || []);
    } catch (error) {
      console.error('Fehler beim Laden der Vokabeln:', error);
    }
  };

  const handleCreatePack = async () => {
    if (!newPackName.trim()) return;
    try {
      const pack = await customVocabAPI.createPack(newPackName.trim());
      setPacks((prev) => [...prev, pack]);
      setNewPackName('');
      setSelectedPack(pack);
    } catch (error) {
      console.error('Fehler beim Erstellen:', error);
    }
  };

  const handleDeletePack = async (packId: string) => {
    if (!confirm('Pack und alle Vokabeln löschen?')) return;
    try {
      await customVocabAPI.deletePack(packId);
      setPacks((prev) => prev.filter((p) => p.id !== packId));
      if (selectedPack?.id === packId) setSelectedPack(null);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleAddVocab = async () => {
    if (!selectedPack || !newGerman.trim() || !newEnglish.trim()) return;
    try {
      await customVocabAPI.createVocabulary(selectedPack.id, newGerman.trim(), newEnglish.trim());
      setNewGerman('');
      setNewEnglish('');
      loadVocabularies(selectedPack.id);
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
    }
  };

  const handleDeleteVocab = async (vocabId: string) => {
    if (!confirm('Vokabel löschen?')) return;
    try {
      await customVocabAPI.deleteVocabulary(vocabId);
      if (selectedPack) loadVocabularies(selectedPack.id);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleUpdatePackName = async () => {
    if (!selectedPack || !editingPackName.trim()) return;
    try {
      await customVocabAPI.updatePack(selectedPack.id, editingPackName.trim());
      setPacks((prev) => prev.map((p) => (p.id === selectedPack.id ? { ...p, name: editingPackName.trim() } : p)));
      setSelectedPack({ ...selectedPack, name: editingPackName.trim() });
      setEditingPackName('');
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              VocabMaster
            </Link>
            <Link to="/">
              <Button variant="secondary" size="sm">
                Zurück
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
          Meine Vokabeln
        </h2>

        <Card className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Neues Level erstellen</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newPackName}
              onChange={(e) => setNewPackName(e.target.value)}
              placeholder="Level-Name (z.B. Unit 1)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <Button onClick={handleCreatePack} disabled={!newPackName.trim()}>
              Erstellen
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Deine Level</h3>
            {packs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Noch keine Level. Erstelle oben ein neues Level.</p>
            ) : (
              <div className="space-y-2">
                {packs.map((pack) => (
                  <div
                    key={pack.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      selectedPack?.id === pack.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="flex-1"
                      onClick={() => setSelectedPack(pack)}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{pack.name}</span>
                      {selectedPack?.id === pack.id && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({vocabularies.length} Vokabeln)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePack(pack.id);
                      }}
                    >
                      Löschen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            {selectedPack ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  {editingPackName ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editingPackName}
                        onChange={(e) => setEditingPackName(e.target.value)}
                        className="flex-1 px-3 py-1 border rounded dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdatePackName}>Speichern</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingPackName('')}>Abbrechen</Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPack.name}</h3>
                      <Button size="sm" variant="secondary" onClick={() => setEditingPackName(selectedPack.name)}>
                        Umbenennen
                      </Button>
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Vokabel hinzufügen</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newGerman}
                      onChange={(e) => setNewGerman(e.target.value)}
                      placeholder="Deutsch"
                      className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newEnglish}
                      onChange={(e) => setNewEnglish(e.target.value)}
                      placeholder="Englisch"
                      className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <Button onClick={handleAddVocab} disabled={!newGerman.trim() || !newEnglish.trim()} size="sm">
                    Hinzufügen
                  </Button>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Vokabeln</h4>
                  {vocabularies.length === 0 ? (
                    <p className="text-gray-500 text-sm">Noch keine Vokabeln. Füge oben welche hinzu.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {vocabularies.map((v) => (
                        <div
                          key={v.vocabId}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex gap-2 items-center flex-1 min-w-0">
                            <span className="text-gray-900 dark:text-white truncate">{v.german}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate">{v.english}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => speakGerman(v.german)}
                              className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200"
                              title="Deutsch abspielen"
                            >
                              🔊 DE
                            </button>
                            <button
                              type="button"
                              onClick={() => speakEnglish(v.english)}
                              className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 rounded hover:bg-primary-200"
                              title="Englisch abspielen"
                            >
                              🔊 EN
                            </button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="!px-2 !py-0.5 text-xs"
                              onClick={() => handleDeleteVocab(v.vocabId)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Wähle ein Level aus oder erstelle ein neues.</p>
            )}
          </Card>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          Deine Custom-Vokabeln kannst du im Singleplayer und Multiplayer unter „Meine Level“ auswählen.
        </p>
      </main>
    </div>
  );
}
