"use client";

import { useState, useMemo } from "react";
import {
  categories,
  commerceServices,
  getServicesByCategory,
  searchServices,
} from "@/data/commerce";
import ServiceCard from "@/components/ServiceCard";
import CategoryFilter from "@/components/CategoryFilter";
import SearchBar from "@/components/SearchBar";

export default function CommerceList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    let services = selectedCategory
      ? getServicesByCategory(selectedCategory)
      : commerceServices;

    if (searchQuery.trim()) {
      const searchResults = searchServices(searchQuery);
      services = services.filter((s) =>
        searchResults.some((sr) => sr.id === s.id)
      );
    }

    return services;
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        총 {filteredServices.length}개의 서비스
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      {filteredServices.length === 0 && (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
