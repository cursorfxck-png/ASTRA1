"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageCropper } from "@/components/ImageCropper";
import { hasMediaSrc } from "@/lib/content-merge";

import type { CollectionItem, HeroSlide, RichTextContent, SiteContent, ProductCard } from "@/lib/types";

type AdminTab = "slides" | "collections" | "content" | "sections";

interface AdminClientProps {
  initialContent: SiteContent;
}

interface SlideDraft {
  mediaType: "image" | "video";
  mediaUrl: string;
  buttonText: string;
  buttonUrl: string;
  file: File | null;
  aspectRatio?: string;
}

interface CollectionDraft {
  title: string;
  imageUrl: string;
  linkUrl: string;
  file: File | null;
}

interface CropState {
  file: File;
  onComplete: (blob: Blob, aspectRatio: string) => void;
}

const emptySlideDraft: SlideDraft = {
  mediaType: "image",
  mediaUrl: "",
  buttonText: "",
  buttonUrl: "",
  file: null
};

const emptyCollectionDraft: CollectionDraft = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  file: null
};

export function AdminClient({ initialContent }: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("slides");
  const [content, setContent] = useState(initialContent);
  const [slideDraft, setSlideDraft] = useState<SlideDraft>(emptySlideDraft);
  const [collectionDraft, setCollectionDraft] = useState<CollectionDraft>(emptyCollectionDraft);
  const [richTextDraft, setRichTextDraft] = useState<RichTextContent>(initialContent.richText);
  const [collageOneDraft, setCollageOneDraft] = useState(initialContent.collageOne);
  const [featuredDraft, setFeaturedDraft] = useState(initialContent.featuredSection);
  const [collageTwoDraft, setCollageTwoDraft] = useState(initialContent.collageTwo);
  const [statusMessage, setStatusMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});

  const slides = useMemo(() => content.heroSlides, [content.heroSlides]);
  const collections = useMemo(() => content.collections, [content.collections]);

  const savePartial = async (payload: Partial<SiteContent>) => {
    setBusy(true);
    setStatusMessage("");

    const response = await fetch("/api/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to save changes.");
    }

    setContent(result as SiteContent);
    setRichTextDraft((result as SiteContent).richText);
    setCollageOneDraft((result as SiteContent).collageOne);
    setFeaturedDraft((result as SiteContent).featuredSection);
    setCollageTwoDraft((result as SiteContent).collageTwo);
    router.refresh();
    setBusy(false);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Upload failed.");
    }

    return result.url as string;
  };

  const deleteFile = async (url: string) => {
    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        console.warn("Failed to delete file from storage:", url);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleFileSelect = (file: File, onComplete: (blob: Blob, aspectRatio: string) => void) => {
    // Check if it's an image that should be cropped
    if (file.type.startsWith("image/")) {
      setCropState({ file, onComplete });
    } else {
      // For videos, just upload directly
      onComplete(file, "16:9");
    }
  };

  const handleCropComplete = async (croppedBlob: Blob, aspectLabel: string) => {
    if (!cropState) return;

    const croppedFile = new File([croppedBlob], cropState.file.name, {
      type: "image/jpeg"
    });

    cropState.onComplete(croppedFile as any, aspectLabel);
    setCropState(null);
  };

  const handleCropCancel = () => {
    setCropState(null);
  };

  const handleAddSlide = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      let mediaUrl = slideDraft.mediaUrl.trim();
      let aspectRatio = slideDraft.aspectRatio;

      if (slideDraft.file) {
        mediaUrl = await uploadFile(slideDraft.file);
      }

      if (!mediaUrl) {
        throw new Error("Please upload a file or provide a media URL.");
      }

      const nextSlide: HeroSlide = {
        id: `slide-${Date.now()}`,
        mediaType: slideDraft.mediaType,
        mediaUrl,
        buttonText: slideDraft.buttonText.trim(),
        buttonUrl: slideDraft.buttonUrl.trim(),
        ...(aspectRatio && { aspectRatio })
      };

      await savePartial({
        heroSlides: [...slides, nextSlide]
      });

      setSlideDraft(emptySlideDraft);
      setImagePreview({});
      setStatusMessage("Slide added successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to add slide.");
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    try {
      const slide = slides.find((s) => s.id === slideId);
      
      await savePartial({
        heroSlides: slides.filter((slide) => slide.id !== slideId)
      });
      
      // Delete from Supabase storage
      if (slide?.mediaUrl) {
        await deleteFile(slide.mediaUrl);
      }
      
      setStatusMessage("Slide deleted successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to delete slide.");
    }
  };

  const handleAddCollection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      let imageUrl = collectionDraft.imageUrl.trim();

      if (collectionDraft.file) {
        imageUrl = await uploadFile(collectionDraft.file);
      }

      if (!imageUrl) {
        throw new Error("Please upload an image or provide an image URL.");
      }

      const nextCollection: CollectionItem = {
        id: `collection-${Date.now()}`,
        title: collectionDraft.title.trim(),
        imageUrl,
        linkUrl: collectionDraft.linkUrl.trim()
      };

      await savePartial({
        collections: [...collections, nextCollection]
      });

      setCollectionDraft(emptyCollectionDraft);
      setImagePreview({});
      setStatusMessage("Collection added successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to add collection.");
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const collection = collections.find((c) => c.id === collectionId);
      
      await savePartial({
        collections: collections.filter((collection) => collection.id !== collectionId)
      });
      
      // Delete from Supabase storage
      if (collection?.imageUrl) {
        await deleteFile(collection.imageUrl);
      }
      
      setStatusMessage("Collection deleted successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to delete collection.");
    }
  };

  const handleSaveRichText = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await savePartial({
        richText: richTextDraft
      });
      setStatusMessage("Landing content updated successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to update content.");
    }
  };

  const handleSaveSections = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await savePartial({
        collageOne: collageOneDraft,
        featuredSection: featuredDraft,
        collageTwo: collageTwoDraft
      });
      setStatusMessage("Sections updated successfully.");
    } catch (error) {
      setBusy(false);
      setStatusMessage(error instanceof Error ? error.message : "Unable to update sections.");
    }
  };

  const updateCard = (
    section: "collageOne" | "featuredSection" | "collageTwo",
    type: "largeCard" | "stackedCards" | "items",
    index: number | null,
    field: keyof ProductCard,
    value: string
  ) => {
    if (section === "collageOne") {
      setCollageOneDraft((prev) => {
        if (type === "largeCard") {
          return { ...prev, largeCard: { ...prev.largeCard, [field]: value } };
        } else if (type === "stackedCards" && index !== null) {
          const newStacked = [...prev.stackedCards];
          newStacked[index] = { ...newStacked[index], [field]: value };
          return { ...prev, stackedCards: newStacked };
        }
        return prev;
      });
    } else if (section === "collageTwo") {
      setCollageTwoDraft((prev) => {
        if (type === "largeCard") {
          return { ...prev, largeCard: { ...prev.largeCard, [field]: value } };
        } else if (type === "stackedCards" && index !== null) {
          const newStacked = [...prev.stackedCards];
          newStacked[index] = { ...newStacked[index], [field]: value };
          return { ...prev, stackedCards: newStacked };
        }
        return prev;
      });
    } else if (section === "featuredSection") {
      setFeaturedDraft((prev) => {
        if (type === "items" && index !== null) {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], [field]: value };
          return { ...prev, items: newItems };
        }
        return prev;
      });
    }
  };

  const handleCardImageUpload = async (
    section: "collageOne" | "featuredSection" | "collageTwo",
    type: "largeCard" | "stackedCards" | "items",
    index: number | null,
    file: File
  ) => {
    handleFileSelect(file, async (croppedFile, aspectLabel) => {
      setBusy(true);
      try {
        const imageUrl = await uploadFile(croppedFile as any);
        updateCard(section, type, index, "imageUrl", imageUrl);
        // Also update the aspect ratio
        updateCard(section, type, index, "imageRatio", aspectLabel === "Square (1:1)" ? "100%" : "125%");
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <>
      {cropState && (
        <ImageCropper
          imageFile={cropState.file}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    <div className="cms-page">
      <div className="cms-header">
        <h2>Website Content Manager</h2>
        <a className="cms-close" href="/">
          Exit &amp; View Site
        </a>
      </div>

      <div className="cms-container">
        <div className="cms-nav">
          <button
            className={activeTab === "slides" ? "active" : undefined}
            onClick={() => setActiveTab("slides")}
            type="button"
          >
            Hero Slideshow
          </button>
          <button
            className={activeTab === "collections" ? "active" : undefined}
            onClick={() => setActiveTab("collections")}
            type="button"
          >
            Collections
          </button>
          <button
            className={activeTab === "content" ? "active" : undefined}
            onClick={() => setActiveTab("content")}
            type="button"
          >
            Landing Content
          </button>
          <button
            className={activeTab === "sections" ? "active" : undefined}
            onClick={() => setActiveTab("sections")}
            type="button"
          >
            Collage &amp; Featured
          </button>
          <a href="/" className="cms-back-link">
            Open landing page
          </a>
        </div>

        <div className="cms-content">
          {statusMessage ? <div className="cms-alert">{statusMessage}</div> : null}

          {activeTab === "slides" ? (
            <div className="tab-pane">
              <h3>Add New Slide</h3>
              <form className="cms-form" onSubmit={handleAddSlide}>
                <label htmlFor="slide-type">Media Type</label>
                <select
                  id="slide-type"
                  value={slideDraft.mediaType}
                  onChange={(event) =>
                    setSlideDraft((current) => ({
                      ...current,
                      mediaType: event.target.value as SlideDraft["mediaType"]
                    }))
                  }
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>

                <label htmlFor="slide-file">Upload File (Image/Video)</label>
                <input
                  id="slide-file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (file.type.startsWith("image/")) {
                      handleFileSelect(file, async (croppedFile, aspectLabel) => {
                        setBusy(true);
                        try {
                          const url = await uploadFile(croppedFile as any);
                          setSlideDraft((current) => ({
                            ...current,
                            file: null,
                            mediaUrl: url,
                            aspectRatio: aspectLabel
                          }));
                          setImagePreview({ ...imagePreview, slide: url });
                        } catch (error) {
                          setStatusMessage(error instanceof Error ? error.message : "Upload failed");
                        } finally {
                          setBusy(false);
                        }
                      });
                    } else {
                      setSlideDraft((current) => ({
                        ...current,
                        file
                      }));
                    }
                  }}
                />
                {imagePreview.slide && (
                  <div className="image-preview-container">
                  {imagePreview.slide && hasMediaSrc(imagePreview.slide) ? (
                    <img src={imagePreview.slide} alt="Preview" className="image-preview" />
                  ) : null}
                    <p className="image-info">Image ready to be added to slide</p>
                  </div>
                )}
                <small>Or paste URL below if not uploading</small>
                <input
                  type="url"
                  placeholder="https://..."
                  value={slideDraft.mediaUrl}
                  onChange={(event) =>
                    setSlideDraft((current) => ({
                      ...current,
                      mediaUrl: event.target.value
                    }))
                  }
                />

                <label htmlFor="slide-btn-text">Button Text (Optional)</label>
                <input
                  id="slide-btn-text"
                  type="text"
                  placeholder="e.g. Shop Now"
                  value={slideDraft.buttonText}
                  onChange={(event) =>
                    setSlideDraft((current) => ({
                      ...current,
                      buttonText: event.target.value
                    }))
                  }
                />

                <label htmlFor="slide-btn-url">Button Link (Optional)</label>
                <input
                  id="slide-btn-url"
                  type="text"
                  placeholder="e.g. /collections/all"
                  value={slideDraft.buttonUrl}
                  onChange={(event) =>
                    setSlideDraft((current) => ({
                      ...current,
                      buttonUrl: event.target.value
                    }))
                  }
                />

                <button type="submit" disabled={busy}>
                  {busy ? "Saving..." : "Add Slide"}
                </button>
              </form>

              <h3>Existing Slides</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Type</th>
                    <th>Button</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slides.map((slide) => (
                    <tr key={slide.id}>
                      <td>
                        {slide.mediaType === "video" ? (
                          <span>📽️ Video</span>
                        ) : hasMediaSrc(slide.mediaUrl) ? (
                          <img src={slide.mediaUrl} alt={slide.buttonText || "Slide preview"} />
                        ) : (
                          <span>No image</span>
                        )}
                      </td>
                      <td>{slide.mediaType}</td>
                      <td>{slide.buttonText || "-"}</td>
                      <td>
                        <button
                          className="btn-delete"
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "collections" ? (
            <div className="tab-pane">
              <h3>Add New Collection</h3>
              <form className="cms-form" onSubmit={handleAddCollection}>
                <label htmlFor="coll-title">Collection Title</label>
                <input
                  id="coll-title"
                  type="text"
                  required
                  value={collectionDraft.title}
                  onChange={(event) =>
                    setCollectionDraft((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />

                <label htmlFor="coll-file">Upload Image</label>
                <input
                  id="coll-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    handleFileSelect(file, async (croppedFile, aspectLabel) => {
                      setBusy(true);
                      try {
                        const url = await uploadFile(croppedFile as any);
                        setCollectionDraft((current) => ({
                          ...current,
                          file: null,
                          imageUrl: url
                        }));
                        setImagePreview({ ...imagePreview, collection: url });
                      } catch (error) {
                        setStatusMessage(error instanceof Error ? error.message : "Upload failed");
                      } finally {
                        setBusy(false);
                      }
                    });
                  }}
                />
                {imagePreview.collection && (
                  <div className="image-preview-container">
                  {imagePreview.collection && hasMediaSrc(imagePreview.collection) ? (
                    <img src={imagePreview.collection} alt="Preview" className="image-preview" />
                  ) : null}
                    <p className="image-info">Image ready to be added to collection</p>
                  </div>
                )}
                <small>Or paste URL below</small>
                <input
                  type="url"
                  placeholder="https://..."
                  value={collectionDraft.imageUrl}
                  onChange={(event) =>
                    setCollectionDraft((current) => ({
                      ...current,
                      imageUrl: event.target.value
                    }))
                  }
                />

                <label htmlFor="coll-link">Link URL</label>
                <input
                  id="coll-link"
                  type="text"
                  required
                  value={collectionDraft.linkUrl}
                  onChange={(event) =>
                    setCollectionDraft((current) => ({
                      ...current,
                      linkUrl: event.target.value
                    }))
                  }
                />

                <button type="submit" disabled={busy}>
                  {busy ? "Saving..." : "Add Collection"}
                </button>
              </form>

              <h3>Existing Collections</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection) => (
                    <tr key={collection.id}>
                      <td>
                        {hasMediaSrc(collection.imageUrl) ? (
                          <img src={collection.imageUrl} alt={collection.title} />
                        ) : (
                          <span>No image</span>
                        )}
                      </td>
                      <td>{collection.title}</td>
                      <td>
                        <button
                          className="btn-delete"
                          type="button"
                          onClick={() => handleDeleteCollection(collection.id)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "content" ? (
            <div className="tab-pane">
              <h3>Edit Rich Text Section</h3>
              <form className="cms-form" onSubmit={handleSaveRichText}>
                <label htmlFor="content-title">Title</label>
                <input
                  id="content-title"
                  type="text"
                  required
                  value={richTextDraft.title}
                  onChange={(event) =>
                    setRichTextDraft((current) => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />

                <label htmlFor="content-subtitle">Subtitle / Description</label>
                <textarea
                  id="content-subtitle"
                  rows={3}
                  required
                  value={richTextDraft.subtitle}
                  onChange={(event) =>
                    setRichTextDraft((current) => ({
                      ...current,
                      subtitle: event.target.value
                    }))
                  }
                />

                <label htmlFor="content-btn-text">Button Text</label>
                <input
                  id="content-btn-text"
                  type="text"
                  required
                  value={richTextDraft.buttonText}
                  onChange={(event) =>
                    setRichTextDraft((current) => ({
                      ...current,
                      buttonText: event.target.value
                    }))
                  }
                />

                <label htmlFor="content-btn-url">Button URL</label>
                <input
                  id="content-btn-url"
                  type="text"
                  required
                  value={richTextDraft.buttonUrl}
                  onChange={(event) =>
                    setRichTextDraft((current) => ({
                      ...current,
                      buttonUrl: event.target.value
                    }))
                  }
                />

                <button type="submit" disabled={busy}>
                  {busy ? "Saving..." : "Update Content"}
                </button>
              </form>
            </div>
          ) : null}

          {activeTab === "sections" ? (
            <div className="tab-pane">
              <form onSubmit={handleSaveSections}>
                <div style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <h3>Section 1: Collage One</h3>
                  <label>Section Title</label>
                  <input
                    style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
                    type="text"
                    value={collageOneDraft.title}
                    onChange={(e) => setCollageOneDraft((p) => ({ ...p, title: e.target.value }))}
                  />

                  <h4>Large Card</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: "0.8rem" }}>Upload Large Card Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCardImageUpload("collageOne", "largeCard", null, file);
                        }}
                        style={{ display: "block", marginBottom: "0.5rem" }}
                      />
                    </div>
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Title"
                      value={collageOneDraft.largeCard.title}
                      onChange={(e) => updateCard("collageOne", "largeCard", null, "title", e.target.value)}
                    />
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Image URL (Alternative to upload)"
                      value={collageOneDraft.largeCard.imageUrl}
                      onChange={(e) => updateCard("collageOne", "largeCard", null, "imageUrl", e.target.value)}
                    />
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Link URL"
                      value={collageOneDraft.largeCard.linkUrl}
                      onChange={(e) => updateCard("collageOne", "largeCard", null, "linkUrl", e.target.value)}
                    />
                  </div>

                  <h4>Stacked Cards</h4>
                  {collageOneDraft.stackedCards.map((card, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "10px",
                        padding: "10px",
                        background: "#f9f9f9",
                        borderRadius: "4px"
                      }}
                    >
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.8rem" }}>Upload Card Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCardImageUpload("collageOne", "stackedCards", idx, file);
                          }}
                        />
                      </div>
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Title"
                        value={card.title}
                        onChange={(e) => updateCard("collageOne", "stackedCards", idx, "title", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Image URL"
                        value={card.imageUrl}
                        onChange={(e) => updateCard("collageOne", "stackedCards", idx, "imageUrl", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Price"
                        value={card.price || ""}
                        onChange={(e) => updateCard("collageOne", "stackedCards", idx, "price", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Link URL"
                        value={card.linkUrl}
                        onChange={(e) => updateCard("collageOne", "stackedCards", idx, "linkUrl", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <h3>Section 2: Featured Section</h3>
                  <label>Section Title</label>
                  <input
                    style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
                    type="text"
                    value={featuredDraft.title}
                    onChange={(e) => setFeaturedDraft((p) => ({ ...p, title: e.target.value }))}
                  />

                  <h4>Items</h4>
                  {featuredDraft.items.map((card, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "10px",
                        padding: "10px",
                        background: "#f9f9f9",
                        borderRadius: "4px"
                      }}
                    >
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.8rem" }}>Upload Card Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCardImageUpload("featuredSection", "items", idx, file);
                          }}
                        />
                      </div>
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Title"
                        value={card.title}
                        onChange={(e) => updateCard("featuredSection", "items", idx, "title", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Image URL"
                        value={card.imageUrl}
                        onChange={(e) => updateCard("featuredSection", "items", idx, "imageUrl", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Price"
                        value={card.price || ""}
                        onChange={(e) => updateCard("featuredSection", "items", idx, "price", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Link URL"
                        value={card.linkUrl}
                        onChange={(e) => updateCard("featuredSection", "items", idx, "linkUrl", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                  <h3>Section 3: Collage Two</h3>
                  <label>Section Title</label>
                  <input
                    style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
                    type="text"
                    value={collageTwoDraft.title}
                    onChange={(e) => setCollageTwoDraft((p) => ({ ...p, title: e.target.value }))}
                  />

                  <h4>Large Card</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1rem" }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: "0.8rem" }}>Upload Large Card Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCardImageUpload("collageTwo", "largeCard", null, file);
                        }}
                        style={{ display: "block", marginBottom: "0.5rem" }}
                      />
                    </div>
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Title"
                      value={collageTwoDraft.largeCard.title}
                      onChange={(e) => updateCard("collageTwo", "largeCard", null, "title", e.target.value)}
                    />
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Image URL"
                      value={collageTwoDraft.largeCard.imageUrl}
                      onChange={(e) => updateCard("collageTwo", "largeCard", null, "imageUrl", e.target.value)}
                    />
                    <input
                      style={{ padding: "8px" }}
                      placeholder="Link URL"
                      value={collageTwoDraft.largeCard.linkUrl}
                      onChange={(e) => updateCard("collageTwo", "largeCard", null, "linkUrl", e.target.value)}
                    />
                  </div>

                  <h4>Stacked Cards</h4>
                  {collageTwoDraft.stackedCards.map((card, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        marginBottom: "10px",
                        padding: "10px",
                        background: "#f9f9f9",
                        borderRadius: "4px"
                      }}
                    >
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: "0.8rem" }}>Upload Card Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCardImageUpload("collageTwo", "stackedCards", idx, file);
                          }}
                        />
                      </div>
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Title"
                        value={card.title}
                        onChange={(e) => updateCard("collageTwo", "stackedCards", idx, "title", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Image URL"
                        value={card.imageUrl}
                        onChange={(e) => updateCard("collageTwo", "stackedCards", idx, "imageUrl", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Price"
                        value={card.price || ""}
                        onChange={(e) => updateCard("collageTwo", "stackedCards", idx, "price", e.target.value)}
                      />
                      <input
                        style={{ padding: "8px" }}
                        placeholder="Link URL"
                        value={card.linkUrl}
                        onChange={(e) => updateCard("collageTwo", "stackedCards", idx, "linkUrl", e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }} disabled={busy}>
                  {busy ? "Saving..." : "Update All Sections"}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
    </>
  );
}
